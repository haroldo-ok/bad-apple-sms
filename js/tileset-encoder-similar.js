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
				var step = clusterfck.kmeans(cluster, 2, "manhattan", null, null, 2);
				return a.concat(step);
			}, []);
		}
		return clusters;
	}
	
	function SimilarTileEncoder() {		
	}	
	
	SimilarTileEncoder.prototype = _.extend(new TileSetEncoders.BaseEncoder(), {
		getName: function() {
			return "Remove similar tiles";
		},
		
		doEncoding: function(converted, originalVideo) {
			var tileFrequency = originalVideo.frames.reduce(function(o, frame){ 
				return frame.tiles.reduce(function(o2, tile){ 
					o2[tile] = (o2[tile] || 0) + 1; 
					return o2; 
				}, o); 
			}, {});
			
			var dataForClustering = makeDataForClustering(_.keys(tileFrequency));
			var clusters = progressiveKMeans(_.pluck(dataForClustering, 'data'), 2048)
			
			converted.frames = originalVideo.frames.map(function(origFrame){
				
				var destFrame = {
					number: origFrame.number,
					tiles: [],
					map: []
				};
				
				var tileNumbers = {};
				origFrame.tiles.forEach(function(encodedTile, index){
					var tileNumber = tileNumbers[encodedTile];
					if (_.isUndefined(tileNumber)) {
						tileNumber = destFrame.tiles.length;
						destFrame.tiles.push(encodedTile);
						tileNumbers[encodedTile] = tileNumber;
					}
					
					var tx = index % originalVideo.tileCountX;
					var ty = Math.floor(index / originalVideo.tileCountX);
					if (!destFrame.map[ty]) {
						destFrame.map[ty] = [];
					}
					destFrame.map[ty][tx] = tileNumber;
				});
				
				return destFrame;
			});
		}		
	});
	
	window.TileSetEncoders.register('SimilarTileEncoder', SimilarTileEncoder);
	
})();