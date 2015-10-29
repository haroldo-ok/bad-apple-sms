"use strict";

(function(){
	
	function MirroredTileEncoder() {		
	}
	
	MirroredTileEncoder.prototype = _.extend(new TileSetEncoders.BaseEncoder(), {
		getName: function() {
			return "Remove flipped/mirrored/color-reversed tiles";
		},
		
		doEncoding: function(converted, originalVideo) {
			converted.format = 'TILE_MAPVH';
			
			var tileMap = {};
			function convertTile() {
				
			}
			
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
	
	window.TileSetEncoders.register('MirroredTileEncoder', MirroredTileEncoder);
	
})();