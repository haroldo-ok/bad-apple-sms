var fs = require('fs');
var BinWriter = require('./bin-writer');

var originalVideo = require('../data/encoded-video-20x15-30fps-deltabit.json');

var wr = new BinWriter();	

fs.writeFile('maps-deltabit-rle-unpacked.bin', wr.toBuffer());
