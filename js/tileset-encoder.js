"use strict";

(function(){
	
	var TileSetEncoders = {
		encoders: [],		
		register: function(name, clazz) {
			this[name] = clazz;
			this.encoders.push(clazz);
		}
	}
	
	TileSetEncoders.BaseEncoder = function BaseEncoder() {		
	}
	
	TileSetEncoders.BaseEncoder.prototype = {
		getName: function() {
			throw new Error('getName() was not properly overriden.');
		},
		
		doEncoding: function(converted, originalVideo) {
			throw new Error('doEncoding(converted, originalVideo) was not properly overriden.');			
		},
		
		encode: function(originalVideo) {
			var converted = _.pick(originalVideo, 'tileCountX', 'tileCountY', 'frameRate');
			converted.format = 'TILE_MAP';
			
			this.doEncoding(converted, originalVideo);
			converted.stats = this.stats(converted);
			
			return converted;
		},
		
		stats: function(converted) {
			var stats = {
				maxTileCount: _.chain(converted.frames).pluck('tiles').pluck('length').max().value(),
				frameCount: converted.frames.length,
				globalTileCount: _.chain(converted.frames).pluck('tiles').pluck('length').reduce(function(s, n){ return s + n }, 0).value(),
				globallyUniqueTileCount: _.chain(converted.frames).pluck('tiles').reduce(function(o, ts){ 
					return ts.reduce(function(o2, t){ o2[t] = true; return o2; }, o);
				}, {}).keys().value().length
			};
			stats.estimatedMaximumSize = 
					stats.frameCount * converted.tileCountX * converted.tileCountX + 
					stats.globalTileCount * 8;
			stats.averageTilesPerFrame = Math.round(stats.globalTileCount / stats.frameCount);			
			
			return stats;
		}
	}
	
	window.TileSetEncoders = TileSetEncoders;
	
})();