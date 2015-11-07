var fs = require('fs');
var BinWriter = require('./bin-writer');

var originalVideo = require('../data/encoded-video-20x15-30fps-deltarle.json');

var wr = new BinWriter();

// Header

wr.writeChar('V')
	.writeByte(originalVideo.tileCountX)
	.writeByte(originalVideo.tileCountY)
	.writeByte(originalVideo.frameRate)
	.writeByte(0xFF);
	
// Tile bank

wr.writeChar('T')
	.writeWord(originalVideo.tileBank.length);

originalVideo.tileBank.forEach(function(tile){
	wr.writeHex(tile);
});

// Frames

wr.writeChar('*')
	.writeWord(originalVideo.frames.length);
	
var TILEDATA_TERMINATOR = 0xFFFF;
	
originalVideo.frames.forEach(function(frame){
	wr.writeChar('F');
	
	// Tiles from tilebank
	if (frame.tilesFromBank) {
		frame.tilesFromBank.forEach(function(tile){
			wr.writeWord(tile.dest).writeWord(tile.orig);
		});
	}
	wr.writeWord(TILEDATA_TERMINATOR);

	// Unique tiles included as part of the stream
	if (frame.tilesToStream) {
		frame.tilesToStream.forEach(function(tile){
			wr.writeWord(tile.dest).writeHex(tile.tile);
		});
	}
	wr.writeWord(TILEDATA_TERMINATOR);
});

fs.writeFile('encoded-video-20x15-30fps-deltarle.bin', wr.toBuffer());
