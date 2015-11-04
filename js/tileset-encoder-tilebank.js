"use strict";

(function(){
	
	function TileBankTileEncoder() {		
	}
	
	TileBankTileEncoder.prototype = _.extend(new TileSetEncoders.BaseEncoder(), {
		getName: function() {
			return "Tile bank plus tile streaming";
		},
		
		doEncoding: function(converted, originalVideo) {
			converted.format = 'STREAM_TILE_MAPVH';

			var firstStepEncoding = new TileSetEncoders.MirroredTileEncoder().encode(originalVideo);
			converted.frames = firstStepEncoding.frames;
		}		
	});
	
	window.TileSetEncoders.register('TileBankTileEncoder', TileBankTileEncoder);
	
})();