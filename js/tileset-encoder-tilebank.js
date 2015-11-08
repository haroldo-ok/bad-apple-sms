"use strict";

(function(){
	
	var MAX_TILES_TO_USE = 448;
	
	function TileBankTileEncoder() {		
	}
	
	TileBankTileEncoder.prototype = _.extend(new TileSetEncoders.BaseEncoder(), {
		getName: function() {
			return "Tile bank plus tile streaming";
		},
		
		doEncoding: function(converted, originalVideo) {
			converted.format = 'TILEBANK_MAPVH';

			var firstStepEncoding = new TileSetEncoders.ReducedTileEncoder().encode(originalVideo);
			
			// The tileBank contains the tiles that are used more than once; the others become part of the video stream.
			converted.tileBank = _.chain(firstStepEncoding.frames)
					.pluck('tiles').flatten().countBy().pairs()
					.filter(function(pair){ return pair[1] > 1 }).pluck(0)
					.sort().value();
					
			var indexOfTiles = converted.tileBank.reduce(function(o, tile, idx){ 
				o[tile] = idx; 
				return o; 
			}, {});
			
			var allocatedTiles = [];
			for (var i = 0; i != MAX_TILES_TO_USE; i++) {
				allocatedTiles.push({
					number: i,
					tile: null,
					age: 0
				});
			}
			
			converted.frames = firstStepEncoding.frames.map(function(origFrame){
				var destFrame = _.pick(origFrame, 'number');
				
				var replacementPriority = allocatedTiles.slice().sort(function(a, b){
					// Empty tiles come first
					if (!a.tile && b.tile) {
						return -1;
					} else if (a.tile && !b.tile) {
						return 1;
					}
					
					// Then the non-empty, by decreasing age
					return b.age - a.age;
				});					
				
				var allocTileIndex = _.indexBy(allocatedTiles, 'tile');
				
				origFrame.tiles.forEach(function(tile){
					var alloc = allocTileIndex[tile];
					if (alloc) {
						// Tile already loaded; reset aging
						alloc.age = 0;
						replacementPriority = _.without(replacementPriority, alloc);
					} else {
						// Tile is not loaded; find which tile should be replaced
						var toReplace = replacementPriority.shift();
						
						// Remove the old, put the new, update indexes
						delete allocTileIndex[toReplace.tile];
						allocTileIndex[tile] = toReplace;
						_.extend(toReplace, {
							tile: tile,
							age: 0
						});
						
						// Where will the tile come from?
						var bankTileNum = indexOfTiles[tile];
						if (_.isNumber(bankTileNum)) {
							// Tile comes from tileBank
							
							if (!destFrame.tilesFromBank) {
								destFrame.tilesFromBank = [];
							}
							
							destFrame.tilesFromBank.push({
								orig: bankTileNum,
								dest: toReplace.number
							});
						} else {
							// Tile is streamed along with the frame
							
							if (!destFrame.tilesToStream) {
								destFrame.tilesToStream = [];
							}

							destFrame.tilesToStream.push({
								tile: tile,
								dest: toReplace.number
							});
						}						
					}					
				});
				
				// Update the map indexes
				destFrame.map = origFrame.map.map(function(line){
					return line.map(function(cell){
						var tile = origFrame.tiles[cell.n];
						var tileNumber = allocTileIndex[tile].number;
						return _.extend({n: tileNumber}, _.pick(cell, 'v', 'h', 'i'));
					});
				});
				
				// Increment the age of the tiles
				allocatedTiles.forEach(function(alloc){
					alloc.age++;
				});
				
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
			};
			
			stats.estimatedMaximumSize = converted.tileBank.length * 8 + // Supposes there's no compression
					stats.totalTileLoadsFromBank * (2 + 2) + // Tile # from bank + VRAM tile #
					stats.totalTilesToStream * (8 + 2) + // Tile data (8 bytes) + VRAM tile #
					stats.frameCount * converted.tileCountX * converted.tileCountY * 2; // tile number + attrs
			
			return stats;
		}
	});
	
	window.TileSetEncoders.register('TileBankTileEncoder', TileBankTileEncoder);
	
})();