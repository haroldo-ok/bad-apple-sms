"use strict";

(function(){

	function ReducedTileEncoder() {		
	}
	
	ReducedTileEncoder.reduceTileCountTo = 0;
	
	ReducedTileEncoder.prototype = _.extend(new TileSetEncoders.BaseEncoder(), {
		getName: function() {
			return "Merge together similar tiles toward a target size";
		},
		
		doEncoding: function(converted, originalVideo) {
			var firstStepEncoding = new TileSetEncoders.MirroredTileEncoder().encode(originalVideo);			
			_.extend(converted, firstStepEncoding);
			
			if (!ReducedTileEncoder.reduceTileCountTo) {
				return;
			}

			var tileFrequency = firstStepEncoding.frames.reduce(function(o, frame){ 
				return frame.tiles.reduce(function(o2, tile){ 
					o2[tile] = (o2[tile] || 0) + 1; 
					return o2; 
				}, o); 
			}, {});
			
			var byPopularity = _.chain(tileFrequency).pairs().sortBy(1).pluck(0).reverse().value();
			var encodingParams = [
				//{stepX: 2, stepY: 2, divisor: 1.5, percent: 0.05},
				{stepX: 2, stepY: 4, divisor: 3.5, percent: 0.1},
				{stepX: 4, stepY: 4, divisor: 8, percent: 100},
			];
			
			var encodingGroups = byPopularity.map(function(hex, i){
				var percent = Math.min(100, i * 100 / byPopularity.length);
				return {
					hex: hex,
					param: _.find(encodingParams, function(param){
						return param.percent > percent;
					})
				};
			});
			
			var clusters = _.chain(encodingGroups).groupBy(function(info){ 
				var tileBits = TileSet.hexToTile(info.hex),
					averaged = [],
					stepX = info.param.stepX, 
					stepY = info.param.stepY,
					divisor = info.param.divisor;
					
				for (var i = 0; i < 8; i += stepY) {
					for (var j = 0; j < 8; j += stepX) {
						var val = 0;
						
						for (var k = 0; k != stepY; k++) {
							for (var l = 0; l != stepX; l++) {
								val += tileBits[i + k][j + l];
							}							
						}
						
						averaged.push(Math.round(val / divisor));
					}					
				}
				
				return averaged;
			}).values().map(function(cluster){
				return _.pluck(cluster, 'hex');
			}).value();

			// Merges together the tiles from each cluster
			var mergedTiles = clusters.reduce(function(o, cluster){
				var tilesToMerge = cluster.map(function(hex){
					return {
						hex: hex,
						bits: TileSet.hexToTile(hex)
					};						
				});
				var totalFrequency = tilesToMerge.reduce(function(t, data){ return t + tileFrequency[data.hex]; }, 0);
				
				// Creates a zeroed-out merged tile
				var mergedTile = [];
				for (var i = 0; i != 8; i++) {
					mergedTile[i] = [];
					for (var j = 0; j != 8; j++) {
						mergedTile[i][j] = 0;
					}					
				}
				
				// Accumulates every tile into the merged one
				tilesToMerge.forEach(function(data){
					var freq = tileFrequency[data.hex];
					for (var i = 0; i != 8; i++) {
						for (var j = 0; j != 8; j++) {
							mergedTile[i][j] += data.bits[i][j] * freq;
						}					
					}					
				});
				
				// Converts the mergedTile to 1bpp
				for (var i = 0; i != 8; i++) {
					for (var j = 0; j != 8; j++) {
						mergedTile[i][j] = TileSet.ditheredPixel(j, i, mergedTile[i][j] * 255 / totalFrequency);
					}					
				}
				
				var mergedTileHex = TileSet.tileToHex(mergedTile);
				return tilesToMerge.reduce(function(o, data){
					o[data.hex] = mergedTileHex;
					return o;
				}, o);
			}, {});
			
			// Replace the tiles for their similars
			converted.frames = firstStepEncoding.frames.map(function(origFrame){
				var destFrame = Util.deepClone(origFrame);
				
				destFrame.tiles = [];
				var tileTranslate = {};
				var tileNumberTranslate = {};
				origFrame.tiles.forEach(function(origTile, origNum){
					var destTile = mergedTiles[origTile];
					if (!destTile) {
						throw new Error("Couldn't find replacement for " + origTile);
					}
					
					if (!tileTranslate[origTile]) {
						tileTranslate[origTile] = destTile;
						tileNumberTranslate[origNum] = destFrame.tiles.length;
						destFrame.tiles.push(destTile);
					}
				});
				
				destFrame.map.forEach(function(line){
					line.forEach(function(cell){
						cell.n = tileNumberTranslate[cell.n];
					});
				});
						
				return destFrame;
			});
		}		
	});
	
	window.TileSetEncoders.register('ReducedTileEncoder', ReducedTileEncoder);
	
})();