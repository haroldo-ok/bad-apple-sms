"use strict";

(function(){
	
	function RepeatedTileEncoder() {		
	}
	
	RepeatedTileEncoder.prototype = _.extend(new TileSetEncoders.BaseEncoder(), {
		getName: function() {
			return "Remove repeated tiles";
		},
		
		doEncoding: function(converted, originalVideo) {
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
	
	window.TileSetEncoders.register('RepeatedTileEncoder', RepeatedTileEncoder);
	
})();