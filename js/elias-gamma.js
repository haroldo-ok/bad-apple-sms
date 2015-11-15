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
	
	function encodeNumberArray(a) {
		return a.map(encodeNumber).join('');
	}
	
	function decodeNumberArray(bits) {
		var result = [];
		var pos = 0;
		while (pos < bits.length) {
			var r = decodeNumberFromStream(bits, pos);
			result.push(r.value);
			pos = r.nextPos;
		}
		return result;
	}
	
	function encodeBits(bits) {
		var counts = [];
		
		var initialBit = bits[0];
		var currentBit = initialBit;
		for (var pos = 1, count = 1; pos < bits.length; pos++) {
			if (bits[pos] != currentBit) {
				currentBit = bits[pos];
				counts.push(count);
				count = 1;
			} else {
				count++;
			}
		}
		if (count) {
			counts.push(count);
		}
		
		return initialBit + counts.map(encodeNumber).join('');
	}
	
	function decodeBits(bits) {
		var currentBit = bits[0] == 1;
		var numbers = decodeNumberArray(bits.substr(1));
		return numbers.map(function(count){
			var n = currentBit ? '1' : '0';
			var a = new Array(count);
			for (var i = 0; i != count; i++) {
				a[i] = n;
			}
			
			currentBit = !currentBit;
			return a.join('');
		}).join('');
	}
	
	window.EliasGamma = {
		encodeNumber: encodeNumber,
		decodeNumber: decodeNumber,
		encodeNumberArray: encodeNumberArray,
		decodeNumberArray: decodeNumberArray,
		encodeBits: encodeBits,
		decodeBits: decodeBits
	};
	
})();