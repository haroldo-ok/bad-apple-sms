"use strict";

(function(){

var DITHER_THRESHOLDS_4x4 = [
	[1, 9, 3, 11],
	[13, 5, 15, 7],
	[4, 12, 2, 10],
	[16, 8, 14, 6]
];

var TileSet = {
	tileToHex: function(tile) {
		function bitsToHex(bits) {
			return bits.reduce(function(n, pixel){
				return n * 2 + (pixel ? 1 : 0);
			}, 0).toString(16);
		}
	
		return tile.map(function(line){					
			s = bitsToHex(line.slice(0, 4)) + bitsToHex(line.slice(4, 8));
			if (s.length != 2) {
				throw new Error("Wrong length for " + line + ": " + s);
			}
			return s;
		}).join('').toUpperCase();
	},
	
	hexToTile: function(hex) {
		var inGroupsOfTwo = hex.split(/(..)/).filter(Boolean);
		return inGroupsOfTwo.map(function(hexByte){
			var bits = parseInt(hexByte, 16).toString(2).split('').map(function(n){ return parseInt(n) });
			while (bits.length < 8) {
				bits.unshift(0);
			}
			return bits;
		});
	},
	
	ditheredPixel: function(x, y, color) {
		var threshold = DITHER_THRESHOLDS_4x4[y & 0x03][x & 0x03];		
		return color * 17 / 255 > threshold ? 1 : 0;
	}
}

window.TileSet = TileSet

})();