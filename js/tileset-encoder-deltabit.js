"use strict";

(function(){
	
	// Copy the next n bytes, unmodified
	var VERBATIM = 'v';
	// Repeat the next byte n times
	var REPEAT = 'r';
	// Skip the next n bytes
	var SKIP = 's';
	// Sets the top bits of the length of the next command
	var BOOST_LENGTH = 'b';
	// End this frame
	var END = 'e';
	
	var MAX_RLE_LENGTH = 64;
	
	function DeltaBitTileEncoder() {		
	}
	
	DeltaBitTileEncoder.prototype = _.extend(new TileSetEncoders.BaseEncoder(), {
		getName: function() {
			return "Tile bank plus tile streaming plus map delta with control bits";
		},
		
		doEncoding: function(converted, originalVideo) {
			converted.format = 'TILEBANK_DELTABITMAPVH';

			var firstStepEncoding = new TileSetEncoders.TileBankTileEncoder().encode(originalVideo);			
			converted.tileBank = firstStepEncoding.tileBank.slice();
			
			function flattenMap(map) {
				return _.flatten(map);
			}
			
			var prevMapState = flattenMap(_.times(originalVideo.tileCountX * originalVideo.tileCountY, _.constant({n: 0})));
			
			function encodeRLE(cells) {
				var rleCells = [];
				var i = 0;
				while (i < cells.length) {
					var rlePos = i + 1;
					var rleCount = 1;
					while (rlePos < cells.length && rleCount < 255 && _.isEqual(cells[i], cells[rlePos])) {
						rlePos++;
						rleCount++;
					}
					
					if (rleCount > 1) {
						rleCells.push({l: rleCount});
						rleCells.push(cells[i]);
					} else {
						rleCells.push(cells[i]);						
					}
					
					i = rlePos;
				}

				return {
					cells: rleCells,
					size: rleCells.length
				};
			}
			
			function encodeDeltaBit(previous, current) {
				var controlBits  = [];
				var cells = [];
				
				// Counts how many of the first positions have stayed unchanged
				var initialSkip = 0;
				while (initialSkip < current.length && 
						_.isEqual(previous[initialSkip], current[initialSkip])) {
					initialSkip++;
				}
				
				if (initialSkip == current.length) {
					// Nothing changed in this frame.
					return {
						unchanged: true
					};
				}
				
				// Finds out which were unchanged and which weren't
				for (var i = initialSkip; i != current.length; i++) {
					if (_.isEqual(previous[i], current[i])) {
						// Unchanged
						controlBits.push(0);
					} else {
						// Changed
						controlBits.push(1);
						cells.push(current[i]);
					}
				}				
				
				// Joins the control bits into a string (for more compact JSON) and removes the zeroes at the right
				controlBits = controlBits.join('').replace(/0+$/g, '');
								
				var result = {
					initialSkip: initialSkip
				};
				
				// Checks if using Elias-gamma encoding can reduce the size of the control bits
				var eliasGamma = {
					encodedBits: EliasGamma.encodeBits(controlBits),
					originalLength: controlBits.length
				};
				if (Math.ceil(eliasGamma.encodedBits.length/8) < Math.ceil(controlBits.length)) {
					result.eliasGammaControlBits = eliasGamma;
				} else {
					result.controlBits = controlBits;
				}
				
				// Tries to see if RLE is worth it
				var rle = encodeRLE(cells);
				if (rle.size < cells.length) {
					result.rleCells = rle;
				} else {
					result.cells = cells;
				}
				
				return result;
			}
			
			converted.frames = firstStepEncoding.frames.map(function(origFrame){
				var destFrame = _.omit(origFrame, 'map');
				
				var mapState = flattenMap(origFrame.map);				
				destFrame.map = encodeDeltaBit(prevMapState, mapState),
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
				encodedMapBytes: _.chain(converted.frames).pluck('map').map(function(m){  
					return [
						{t: 'a', d: m}
					]; 
				}).flatten().reduce(function(s, data){ 
					var t = data.t;
					var o = data.d;
				
					if (o.unchanged) { 
						return s + 1; 
					} 
					
					// Tile number map uses 12 bit entries
					var cellByteCount = o.cells ? Math.ceil(o.cells.length * 12 / 8) : Math.ceil(o.rleCells.cells.length * 12 / 8);
							
					if (_.isNaN(cellByteCount)) {
						throw new Error('This shouldn\'t be NaN');
					}
					
					var controlBitByteCount = Math.ceil((o.controlBits ? o.controlBits.length : o.eliasGammaControlBits.encodedBits.length) / 8);
					if (_.isNaN(controlBitByteCount)) {
						throw new Error('This shouldn\'t be NaN');
					}
					
					return s + 2 + cellByteCount + controlBitByteCount;
				}, 0).value()
			};
			
			stats.estimatedMaximumSize = converted.tileBank.length * 8 + // Supposes there's no compression
					stats.totalTileLoadsFromBank * (2 + 2) + // Tile # from bank + VRAM tile #
					stats.totalTilesToStream * (8 + 2) + // Tile data (8 bytes) + VRAM tile #
					stats.encodedMapBytes; // Delta RLE encoded maps
			
			return stats;
		}
	});
	
	window.TileSetEncoders.register('DeltaBitTileEncoder', DeltaBitTileEncoder);
	
})();