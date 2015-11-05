"use strict";

(function(){
	
	var BOOLEAN_3_BIT_COMBINATIONS = Util.cartesianProductOf([false, true], [false, true], [false, true]);
	
	function MirroredTileEncoder() {		
	}
	
	MirroredTileEncoder.prototype = _.extend(new TileSetEncoders.BaseEncoder(), {
		getName: function() {
			return "Remove flipped/mirrored/color-reversed tiles";
		},
		
		doEncoding: function(converted, originalVideo) {
			converted.format = 'TILE_MAPVH';
			
			var convertedTileCache = {};
			function convertTile(hex) {
				if (convertedTileCache[hex]) {
					return convertedTileCache[hex];
				}
				
				var originalTile = TileSet.hexToTile(hex);
				var candidates = BOOLEAN_3_BIT_COMBINATIONS.map(function(tuple){
					var candidate = {};
					var transformedTile = Util.deepClone(originalTile);
					
					if (tuple[0]) {
						candidate.h = 1;
						transformedTile = TileSet.flipH(transformedTile);
					}
					
					if (tuple[1]) {
						candidate.v = 1;
						transformedTile = TileSet.flipV(transformedTile);
					}
					
					if (tuple[2]) {
						candidate.i = 1;
						transformedTile = TileSet.inverseColor(transformedTile);
					}
					
					candidate.hex = TileSet.tileToHex(transformedTile);
					return candidate;
				});
				
				convertedTileCache[hex] = candidates.reduce(function(a, b){ 
					return a.hex < b.hex ? a : b
				});
				return convertedTileCache[hex];
			}
			
			converted.frames = originalVideo.frames.map(function(origFrame){
				var destFrame = {
					number: origFrame.number,
					tiles: [],
					map: []
				};
				
				var tileNumbers = {};
				origFrame.tiles.forEach(function(encodedTile, index){
					var convertedTile = convertTile(encodedTile);
					if (!convertedTile || !convertedTile.hex) {
						throw new Error('There was a problem with the tile.');
					}
					
					var tileNumber = tileNumbers[convertedTile.hex];
					if (_.isUndefined(tileNumber)) {
						tileNumber = destFrame.tiles.length;
						destFrame.tiles.push(convertedTile.hex);
						tileNumbers[convertedTile.hex] = tileNumber;
					}
					
					var tx = index % originalVideo.tileCountX;
					var ty = Math.floor(index / originalVideo.tileCountX);
					if (!destFrame.map[ty]) {
						destFrame.map[ty] = [];
					}
					destFrame.map[ty][tx] = _.extend({n: tileNumber}, _.pick(convertedTile, 'v', 'h', 'i'));
				});
				
				return destFrame;
			});
		}		
	});
	
	window.TileSetEncoders.register('MirroredTileEncoder', MirroredTileEncoder);
	
})();