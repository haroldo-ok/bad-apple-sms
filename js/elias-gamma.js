"use strict";

(function(){
	
	function findN(val) {
		if (val == 1) {
			return 0;
		}
				
		var n = 1, mask = 2;
		while (mask <= val) {
			mask <<= 1;
			n++;
		}
		return n - 1;
	}
	
	function encodeNumber(val) {
		if (val == 1) {
			return "1";
		}
		
		var n = findN(val);
		
		var bits = [];
		for (var i = 0; i != n; i++) {
			bits.push('0');
		}
		bits.push(val.toString(2));
		
		return bits.join('');
	}
	
	function decodeNumberFromStream(bits, initialPos) {
		// Counts the zeroes
		var count = 0;
		for (var pos = initialPos; bits[pos] != 1; pos++) {
			count++;
		}
		
		// Gets the value
		var endPos = pos + count + 1;
		var part = bits.substring(pos, endPos);
		var value = parseInt(part, 2);
		
		return {
			value: value,
			nextPos: endPos
		}
	}
	
	function decodeNumber(bits) {
		return decodeNumberFromStream(bits, 0).value;
	}
	
	window.EliasGamma = {
		encodeNumber: encodeNumber,
		decodeNumber: decodeNumber
	};
	
})();