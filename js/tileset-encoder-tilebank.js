"use strict";

(function(){
	
	function TileBankTileEncoder() {		
	}
	
	TileBankTileEncoder.prototype = _.extend(new TileSetEncoders.BaseEncoder(), {
		getName: function() {
			return "Tile bank plus tile streaming";
		},
		
		doEncoding: function(converted, originalVideo) {
			converted.format = 'TILEBANK_MAPVH';

			var firstStepEncoding = new TileSetEncoders.MirroredTileEncoder().encode(originalVideo);
			
			// The tileBank contains the tiles that are used more than once; the others become part of the video stream.
			converted.tileBank = _.chain(firstStepEncoding.frames)
					.pluck('tiles').flatten().countBy().pairs()
					.filter(function(pair){ return pair[1] > 1 }).pluck(0)
					.sort().value();
			
			converted.frames = firstStepEncoding.frames;
		}		
	});
	
	window.TileSetEncoders.register('TileBankTileEncoder', TileBankTileEncoder);
	
})();