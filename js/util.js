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
	},
	
	/** Based on: http://stackoverflow.com/a/12628791/679240 */
	cartesianProductOf: function() {
		return _.reduce(arguments, function(a, b) {
			return _.flatten(_.map(a, function(x) {
				return _.map(b, function(y) {
					return x.concat([y]);
				});
			}), true);
		}, [ [] ]);
	},
	
	deepClone: function(o) {
		return JSON.parse(JSON.stringify(o));
	}

}

})();