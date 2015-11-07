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

fs.writeFile('encoded-video-20x15-30fps-deltarle.bin', wr.toBuffer());
