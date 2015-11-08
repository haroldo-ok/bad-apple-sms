"use strict";

(function(){
	
	function makeDataForClustering(hexTiles) {
		var dataForClustering = hexTiles.map(function(tileHex){ 
			var tileBits = TileSet.hexToTile(tileHex);
			
			var averaged = [];
			for (var i = 0; i < 8; i += 2) {
				for (var j = 0; j < 8; j += 2) {
					var val = tileBits[i][j] +
							tileBits[i + 1][j] +
							tileBits[i][j + 1] +
							tileBits[i + 1][j + 1];
					
					averaged.push(Math.floor(val));
				}					
			}
			
			var data = _.flatten(tileBits).concat(averaged);
			return {
				data: data,
				hex: tileHex
			}; 
		}, {});
		
		return dataForClustering;
	}
	
	function progressiveKMeans(data, maxGroups) {
		var clusters = [ data ];
		while (clusters.length < maxGroups) {
			clusters = clusters.reduce(function(a, cluster){
				var step = clusterfck.kmeans(cluster, 5, "manhattan", null, null, 4);
				return a.concat(step);
			}, []);
		}
		return clusters;
	}

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
			
			var clusters = _.chain(tileFrequency).keys().groupBy(function(hex){ 
				var pairsOfBits = Util.inGroupsOf(_.flatten(TileSet.hexToTile(hex)), 2);
				return pairsOfBits.map(function(pair){ return pair[0] + pair[1] });
			}).values().value();
			
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