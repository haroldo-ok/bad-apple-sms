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
					
					// Checks for repeated tiles
					
					var repeatedPos = pos;
					while (repeatedPos < current.length && repeatedPos - pos < MAX_RLE_LENGTH &&
							_.isEqual(current[pos], current[repeatedPos])) {
						repeatedPos++;
					}
					
					var len = repeatedPos - pos;
					if (len > 1) {
						commands.push({
							c: REPEAT,
							l: len
						});			
						pos += len;
						
						continue;
					}			

					// Checks for non-repeated tiles
					
					var verbatimPos = pos + 1;
					while (verbatimPos < current.length && verbatimPos - pos < MAX_RLE_LENGTH &&
							!_.isEqual(previous[verbatimPos], current[verbatimPos]) &&
							!_.isEqual(current[verbatimPos - 1], current[verbatimPos])) {
						verbatimPos++;
					}
					
					var len = verbatimPos - pos;
					commands.push({
						c: VERBATIM,
						l: len
					});			
					
					while (pos != verbatimPos) {
						commands.push(current[pos]);									
						pos++;						
					}
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
			function add(a, b) {
				return a + b;
			}
			
			function sumLengths(array, attrName) {
				return _.chain(array).pluck(attrName).compact().pluck('length').reduce(add, 0).value();
			}
			
			var tileCounts = _.chain(converted.frames).map(function(f){ return (f.tilesFromBank || []).length + (f.tilesToStream || []).length }).value();
			
			var stats = {
				frameCount: converted.frames.length,
				maxTilesToLoadPerFrame: _.max(tileCounts),
				avgTilesToLoadPerFrame: Math.round(tileCounts.reduce(add, 0) / converted.frames.length),
				totalTileLoadsFromBank: sumLengths(converted.frames, 'tilesFromBank'),
				totalTilesToStream: sumLengths(converted.frames, 'tilesToStream'),
				encodedMapBytes: _.chain(converted.frames).map(function(f){ return f.map.tiles.length + f.map.attrs.length }).reduce(add, 0).value()
			};
			
			stats.estimatedMaximumSize = converted.tileBank.length * 8 + // Supposes there's no compression
					stats.totalTileLoadsFromBank * (2 + 2) + // Tile # from bank + VRAM tile #
					stats.totalTilesToStream * (8 + 2) + // Tile data (8 bytes) + VRAM tile #
					stats.encodedMapBytes; // Delta RLE encoded maps
			
			return stats;
		}
	});
	
	window.TileSetEncoders.register('DeltaRleTileEncoder', DeltaRleTileEncoder);
	
})();