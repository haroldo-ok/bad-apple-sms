"use strict";
var fs = require('fs');
var BinWriter = require('./bin-writer');

var originalVideo = require('../data/encoded-video-20x15-30fps-deltabit.json');

var mapFlags = {
	UNCHANGED: 0x8000,
	USES_ELIAS_GAMMA: 0x4000,
	USES_RLE: 0x2000,
};

var wr = new BinWriter();	

originalVideo.frames.forEach(function(frame){
	var map = frame.map;
	
	// If nothing changed, just output the corresponding flag ("unchanged") and move on
	if (map.unchanged) {
		wr.writeWord(mapFlags.UNCHANGED);
		return;
	}
	
	// If something changed, first build the map frame header
	
	var controlBitsLength = 
			map.controlBits ? map.controlBits.length : 
			map.eliasGammaControlBits ? map.eliasGammaControlBits.encodedBits.length :
			0;
	
	var controlFlags =
			((map.initialSkip || 0) & 0x1F) |	// How many bytes to skip initially
			((controlBitsLength & 0x1F) << 5) |	// How many control bits are being used
			(map.eliasGammaControlBits ? mapFlags.USES_ELIAS_GAMMA : 0) |	// If the control bits are elias-gamma packed
			(map.rleCells ? mapFlags.USES_RLE : 0) ; // If the map data is RLE-packed
	wr.writeWord(controlFlags);
});

fs.writeFile('maps-deltabit-rle-unpacked.bin', wr.toBuffer());
