"use strict";

(function(){
	
	// Copy the next n bytes, unmodified
	var VERBATIM = 'v';
	// Repeat the next byte n times
	var REPEAT = 'r';
	// Skip the next n bytes
	var SKIP = 's';
	// End this frame
	var END = 'e';
	
	var MAX_RLE_LENGTH = 64;
	
	function DeltaRleTileEncoder() {		
	}
	
	DeltaRleTileEncoder.prototype = _.extend(new TileSetEncoders.BaseEncoder(), {
		getName: function() {
			return "Tile bank plus tile streaming plus map delta";
		},
		
		doEncoding: function(converted, originalVideo) {
			converted.format = 'TILEBANK_DELTAMAPVH';

			var firstStepEncoding = new TileSetEncoders.TileBankTileEncoder().encode(originalVideo);			
			converted.tileBank = firstStepEncoding.tileBank.slice();
			
			function flattenMap(map) {
				var flattened = _.flatten(map);
				return {
					tiles: flattened.map(function(cell){
						// The tiles array will only contain the bottom 8 bits of the tile number
						return {
							n: cell.n & 0xFF
						};
					}),
					
					attrs: flattened.map(function(cell){
						var attrs = _.pick(cell, 'v', 'h', 'i');
						// Tells if the 9th bit of the tile number is on
						if (cell.n & 0x100) {
							attrs.s = 1;
						}
						return attrs;
					})
				}
			}
			
			var prevMapState = flattenMap(_.times(originalVideo.tileCountX * originalVideo.tileCountY, _.constant({n: 0})));
			
			function encodeDeltaRle(previous, current) {
				var commands = [];
				
				var pos = 0;
				while (pos < current.length) {
					// Checks how many tiles haven't changed since last frame
					var unchangedPos = pos;
					while (unchangedPos < current.length && 
							_.isEqual(previous[unchangedPos], current[unchangedPos])) {
						unchangedPos++;
					}

					if (unchangedPos >= current.length) {
						commands.push({
							c: END
						});			
						pos = unchangedPos;
						
						continue;
					} else if (unchangedPos > pos) {
						var len = Math.min(unchangedPos - pos, MAX_RLE_LENGTH);
						commands.push({
							c: SKIP,
							l: len
						});			
						pos += len;

						continue;
					}
					
					commands.push({
						c: VERBATIM,
						l: 1
					});									
					commands.push(current[pos]);									
					pos++;
				}
				
				// Always add a 'end' command, if it isn't there already.
				if (_.last(commands).c !== END) {
					commands.push({
						c: END
					});								
				}
				
				return commands;
			}
			
			converted.frames = firstStepEncoding.frames.map(function(origFrame){
				var destFrame = _.omit(origFrame, 'map');
				
				var mapState = flattenMap(origFrame.map);				
				destFrame.map = {
					tiles: encodeDeltaRle(prevMapState.tiles, mapState.tiles),
					attrs: encodeDeltaRle(prevMapState.attrs, mapState.attrs)
				};
				prevMapState = mapState;
				
				return destFrame;
			});
		},
		
		stats: function(converted) {
			var stats = {
			};
			
			return stats;
		}
	});
	
	window.TileSetEncoders.register('DeltaRleTileEncoder', DeltaRleTileEncoder);
	
})();