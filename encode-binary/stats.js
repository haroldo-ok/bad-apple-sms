var _ = require('lodash');

var originalVideo = require('../data/encoded-video-20x15-30fps-deltarle.json');

var frame = originalVideo.frames[1000];
//console.log(frame);
//console.log(_(originalVideo.frames).pluck('number').value());

// Copy the next n bytes, unmodified
var VERBATIM = 'v';
// Repeat the next byte n times
var REPEAT = 'r';
// Skip the next n bytes
var SKIP = 's';
// Sets the top bits of the length of the next command
var BOOST_LENGTH = 'b';
// End this frame
var END = 'e';

var MAX_RLE_LENGTH = 64;

var frameMapCellCount = originalVideo.tileCountX * originalVideo.tileCountY;

function calcDeltaRleStats(commands) {
	var stats = {
		verbatim: {original: 0, encoded: 0},
		repeat: {original: 0, encoded: 0},
		skip: {original: 0, encoded: 0},
		end: {original: 0, encoded: 0}
	};
	
	var bufPos = 0, cmdPos = 0, boost = 0;
	while (commands[cmdPos].c != END) {
		var cmd = commands[cmdPos],
			len = cmd.l + boost;
			
		switch (cmd.c) {
		
			case VERBATIM: {
				// Copies the next n commands
				
				// boost + command + data
				stats.verbatim.original += len;
				stats.verbatim.encoded += (boost ? 1 : 0) + 1 + len;
				
				cmdPos++;
				bufPos += len; cmdPos += len;
				boost = 0;
				break;
			}
			
			case REPEAT: {
				// Copies the next command n times
				
				// boost + command + data
				stats.repeat.original += len;
				stats.repeat.encoded += (boost ? 1 : 0) + 1 + 1;
				
				cmdPos++;
				bufPos += len; 
				cmdPos++;
				boost = 0;
				break;
			}

			case SKIP: {
				// Keeps unchanged the next n bufer positions
				
				// boost + command
				stats.skip.original += len;
				stats.skip.encoded += (boost ? 1 : 0) + 1;
				
				cmdPos++;
				bufPos += len;
				boost = 0;
				break;
			}

			case BOOST_LENGTH: {
				// Sets the top bits of the length of the next command
				cmdPos++;
				boost = cmd.l * MAX_RLE_LENGTH;
				break;
			}
			
			default: {
				throw new Error('Invalid command');
			}
		}
	}

	// Calculates hou many tiles didn't have to be encoded due to the end command.
	stats.end.original = frameMapCellCount - bufPos;
	stats.end.encoded = 1;
	
	return stats;
}

var deltaRleStats = _(originalVideo.frames).map(function(frame){
	return [calcDeltaRleStats(frame.map.tiles), calcDeltaRleStats(frame.map.attrs)];
}).flatten().reduce(function(total, stats){
	_(stats).pairs().each(function(pair){
		var type = pair[0];
		_.each(pair[1], function(v, k){
			total[type][k] += v;
		});
		total[type].saved = total[type].original - total[type].encoded;
	}).value();
	return total;
}, {
	verbatim: {original: 0, encoded: 0},
	repeat: {original: 0, encoded: 0},
	skip: {original: 0, encoded: 0},
	end: {original: 0, encoded: 0}
});

console.log(deltaRleStats);
