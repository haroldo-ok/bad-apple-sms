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
				{stepX: 2, stepY: 2, divisor: 1.5, percent: 100},
//				{stepX: 4, stepY: 4, divisor: 7, percent: 100},
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
				var mergedTile = _.max(cluster, function(hex){
					return tileFrequency[hex];
				});
				
				return cluster.reduce(function(o, hex){
					o[hex] = mergedTile;
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