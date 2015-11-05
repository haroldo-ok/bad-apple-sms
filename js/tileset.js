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
			var n = 0;
			for (var i = 0, l = bits.length; i != l; i++) {
				n = (n << 1) + (bits[i] ? 1 : 0);
			}
			return n.toString(16);
		}
	
		var hexChars = [];
		for (var i = 0, l = tile.length; i != l; i++) {
			var line = tile[i];
			hexChars.push(bitsToHex(line.slice(0, 4)));
			hexChars.push(bitsToHex(line.slice(4, 8)));
		}
		return hexChars.join('').toUpperCase();
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
	},
	
	flipH: function(tile) {
		var output = new Array(tile.length);
		for (var i = 0, l = tile.length; i != l; i++) {
			output[i] = tile[i].slice().reverse();
		}
		return output;
	},
	
	flipV: function(tile) {
		return tile.map(function(line){
			return line.slice();
		}).reverse();
	},
	
	inverseColor: function(tile) {
		var output = new Array(tile.length);
		for (var i = 0, h = output.length; i != h; i++) {
			var line = tile[i];
			var outLine = new Array(line.length);
			
			for (var j = 0, w = outLine.length; j != w; j++) {
				outLine[j] = line[j] ? 0 : 1;
			}
			
			output[i] = outLine;    
		}
		return output;
	}
}

window.TileSet = TileSet

})();