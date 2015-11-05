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
					
			var indexOfTiles = converted.tileBank.reduce(function(o, tile, idx){ 
				o[tile] = idx; 
				return o; 
			}, {});
			
			converted.frames = firstStepEncoding.frames.map(function(origFrame){
				var destFrame = _.pick(origFrame, 'number');
				
				origFrame.tiles.forEach(function(tile){
					var bankTileNum = indexOfTiles[tile];
					if (_.isNumber(bankTileNum)) {
						if (!destFrame.tilesFromBank) {
							destFrame.tilesFromBank = [];
						}
						
						destFrame.tilesFromBank.push({
							orig: bankTileNum
						});
					} else {
						if (!destFrame.tilesToStream) {
							destFrame.tilesToStream = [];
						}

						destFrame.tilesToStream.push({
							tile: tile
						});
					}
				});
				
				return destFrame;
			});
		},
		
		stats: function(converted) {
			var stats = {
				frameCount: converted.frames.length
			};
			
			return stats;
		}
	});
	
	window.TileSetEncoders.register('TileBankTileEncoder', TileBankTileEncoder);
	
})();