var fs = require('fs');
var BinWriter = require('./bin-writer');

var originalVideo = require('../data/encoded-video-20x15-30fps-deltarle.json');
//var originalVideo = require('../data/encoded-video-20x15-30fps-deltarle-reduced.json');

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

// Single-use tiles; placed as a separate stream for better compression efficiency

var allTilesToStream = originalVideo.frames.reduce(function(allTiles, frame){
	if (frame.tilesToStream) {
		frame.tilesToStream.forEach(function(tile){
			allTiles.push(tile.tile);
		});
	}
	return allTiles;
}, []);

wr.writeChar('S')
	.writeWord(allTilesToStream.length);

allTilesToStream.forEach(function(tile){
	wr.writeHex(tile);
});
	
// Frames

wr.writeChar('*')
	.writeWord(originalVideo.frames.length);
	
var TILEDATA_TERMINATOR = 0xFFFF;
var MAP_COMMANDS = {
	// Copy the next n bytes, unmodified (VERBATIM)
	'v': 0x00,
	// Repeat the next byte n times (REPEAT)
	'r': 0x40,
	// Skip the next n bytes (SKIP)
	's': 0x80,
	// Sets the top bits of the length of the next command (BOOST_LENGTH)
	'b': 0xC0,
	// End this frame (END)
	'e': 0xFF
};
var MAP_COUNT_MASK = 0x3F;

function outputMapCommands(commands, formatter) {
	commands.forEach(function(command){
		if (command.c) {
			var prefix = MAP_COMMANDS[command.c];
			var suffix = (command.l || 0) & MAP_COUNT_MASK;
			wr.writeByte(prefix | suffix);
		} else {
			wr.writeByte(formatter(command));
		}
	});	
}
	
originalVideo.frames.forEach(function(frame){
	wr.writeChar('F');
	
	// Tiles from tilebank
	
	if (frame.tilesFromBank) {
		frame.tilesFromBank.forEach(function(tile){
			wr.writeWord(tile.dest).writeWord(tile.orig);
		});
	}
	wr.writeWord(TILEDATA_TERMINATOR);

	// Only the destination slot is part of the stream; the tiles are on a separate stream for efficiency.
	
	if (frame.tilesToStream) {
		frame.tilesToStream.forEach(function(tile){
			wr.writeWord(tile.dest);
		});
	}
	wr.writeWord(TILEDATA_TERMINATOR);
		
	// Map Delta-RLE
	
	outputMapCommands(frame.map.tiles, function(command){
		return command.n;
	});
	outputMapCommands(frame.map.attrs, function(command){
		return (command.t ? 0x01 : 0) | // Is the 9th bit of tile number set?
			(command.h ? 0x02 : 0) | // Is the tile horizontally flipped?
			(command.v ? 0x04 : 0) | // Is the tile vertically flipped?
			(command.i ? 0x08 : 0); // Is the sprite palette being used?
	});
});

fs.writeFile('encoded-video-20x15-30fps-deltarle.bin', wr.toBuffer());
