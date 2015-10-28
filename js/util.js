"use strict";

(function(){

window.Util = {
	inGroupsOf: function(array, groupSize) {
		return array.reduce(function(a, n, index){ 
			var ln = Math.floor(index / groupSize); 
			if (!a[ln]) {
				a[ln] = []; 
			}
			a[ln].push(n); 
			return a 
		}, []);
	}
}

})();