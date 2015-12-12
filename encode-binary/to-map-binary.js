"use strict";
var fs = require('fs');
var BinWriter = require('./bin-writer');

var originalVideo = require('../data/encoded-video-20x15-30fps-deltabit.json');

var mapFlags = {
	UNCHANGED: 0x8000,
	USES_ELIAS_GAMMA: 0x4000,
	USES_RLE: 0x2000,
};

var tileFlags = {
	FLIP_HORIZONTALLY: 0x0200,
	FLIP_VERTICALLY: 0x0400,
	USE_SPRITE_PALETTE: 0x0800
};

function convertCell(cell) {
	if (cell.l) {
		// Is a repeat command
		var word = 
				((cell.l & 0x3F) + 448) | // Tile number is 9 bits, and values 448 to 511 are unused; that's 64 unused values
				((cell.l >> 6) << 9); // The tile flags are used to store the remaining bits.
	} else {
		var word = ((cell.n || 0) & 0x1F) | // Tile number
				(cell.v ? tileFlags.FLIP_VERTICALLY : 0) |
				(cell.h ? tileFlags.FLIP_HORIZONTALLY : 0) |
				(cell.i ? tileFlags.USE_SPRITE_PALETTE : 0);
	}

	return word;
}

function convertVideo(options) {
	var wr = new BinWriter();	

	originalVideo.frames.forEach(function(frame){
		var map = frame.map;
		
		// If nothing changed, just output the corresponding flag ("unchanged") and move on
		if (map.unchanged) {
			wr.writeWord(mapFlags.UNCHANGED);
			return;
		}
		
		// If something changed, first build the map frame header
		
		var controlBits = 
				map.controlBits ? map.controlBits : 
				map.eliasGammaControlBits ? map.eliasGammaControlBits.encodedBits :
				'';
		
		var controlFlags =
				((map.initialSkip || 0) & 0x1F) |	// How many bytes to skip initially
				((controlBits.length & 0x1F) << 5) |	// How many control bits are being used
				(map.eliasGammaControlBits ? mapFlags.USES_ELIAS_GAMMA : 0) |	// If the control bits are elias-gamma packed
				(map.rleCells ? mapFlags.USES_RLE : 0) ; // If the map data is RLE-packed
		wr.writeWord(controlFlags);
		
		// Writes the control bits	
		wr.writeBits(controlBits);
		
		// Writes the map data
		var cellWords = options.prepareCells(map.cells || map.rleCells.cells).map(convertCell);
		options.writeCellWords(wr, cellWords);
	});

	fs.writeFile(options.fileName, wr.toBuffer());
	
}

function prepareCellsRLE(cells) {
	return cells;
}

function prepareCellsNoRle(cells) {
	var result = [];
	
	var pos = 0;
	while (pos < cells.length) {
		var cell = cells[pos];
		pos++;
		
		if (cell.l) {
			var len = cell.l;
			cell = cells[pos];
			pos++;
			
			for (var i = 0; i < len; i++) {
				result.push(cell);
			}
		} else {
			result.push(cell);
		}
	}
	
	return result;
}

function writeCellWordsUnpacked(wr, words) {
	words.forEach(function(word){
		wr.writeWord(word);
	});
}

function writeCellWordsPacked(wr, words) {
	// The tile number + attrs only takes 12 bytes; packs them together
	for (var i = 0; i < words.length; i += 2) {
		var wordA = words[i];
		var wordB = words[i+1];
		wr.writeByte(wordA & 0xFF)
			.writeByte(wordB & 0xFF)
			.writeByte((wordA >> 8) | ((wordB >> 8) << 4));
	}
}

function saveHexTiles(fileName, hexTiles) {
	var wr = new BinWriter();	

	hexTiles.forEach(function(tile){
		wr.writeHex(tile);
	});
	
	fs.writeFile(fileName, wr.toBuffer());
}

convertVideo({
	fileName: 'maps-deltabit-rle-unpacked.bin',
	prepareCells: prepareCellsRLE,
	writeCellWords: writeCellWordsUnpacked
});

convertVideo({
	fileName: 'maps-deltabit-rle-packed.bin',
	prepareCells: prepareCellsRLE,
	writeCellWords: writeCellWordsPacked
});

convertVideo({
	fileName: 'maps-deltabit-norle-unpacked.bin',
	prepareCells: prepareCellsNoRle,
	writeCellWords: writeCellWordsUnpacked
});

convertVideo({
	fileName: 'maps-deltabit-norle-packed.bin',
	prepareCells: prepareCellsNoRle,
	writeCellWords: writeCellWordsPacked
});

saveHexTiles('tiles-reused.bin', originalVideo.tileBank);