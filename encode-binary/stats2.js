var _ = require('lodash');

var originalVideo = require('../data/encoded-video-20x15-30fps-deltabit.json');

function countSingleUseTiles(frame) {
	if (!frame || !frame.tilesToStream) {
		return 0;
	}
	return frame.tilesToStream.length;
}

function max2(a, b) {
	return Math.max(a, b);
}

var maxSingleUseTiles = originalVideo.frames.map(function(frame, i){
	return countSingleUseTiles(frame);
}).reduce(max2, 0);

var maxSingleUseTilesInConsecutiveFrames = originalVideo.frames.map(function(frame, i){
	var nextFrame = originalVideo.frames[i + 1];
	return countSingleUseTiles(frame) + countSingleUseTiles(nextFrame);
}).reduce(max2, 0);

console.log('Max single use tiles: ' + maxSingleUseTiles);
console.log('Max single use tiles in consecutive frames: ' + maxSingleUseTilesInConsecutiveFrames);