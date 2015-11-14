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
	
	window.EliasGamma = {
		encodeNumber: encodeNumber
	};
	
})();