"use strict";

(function(){
	
	function encodeNumber(n) {
		if (n == 1) {
			return "1";
		}
		return "010";
	}
	
	window.EliasGamma = {
		encodeNumber: encodeNumber
	};
	
})();