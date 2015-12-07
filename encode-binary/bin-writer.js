
function BinWriter() {
	this._content = [];
	this._pos = 0;
}

BinWriter.prototype = {
	
	_incPos: function(n) {
		this._pos += n || 1;
	},
	
	writeByte: function(b) {
		this._content[this._pos] = b & 0xFF;
		this._incPos();
		return this;
	},
	
	writeWord: function(w) {
		// LSB first
		return this.writeByte(w).writeByte(w >> 8);		
	},
	
	writeChar: function(c) {
		return this.writeByte(c.charCodeAt(0));
	},
	
	writeHex: function(hex) {
		var that = this,
			inGroupsOfTwo = hex.split(/(..)/).filter(Boolean);			
		inGroupsOfTwo.forEach(function(hexByte){
			that.writeByte(parseInt(hexByte, 16));
		});	
		return this;
	},
	
	writeBits: function(bits) {
		var currByte = 0;
		var mask = 1;
		var pending = false;
		
		for (var i = 0; i < bits.length; i++) {
			var bit = bits[i];
			currByte = currByte | (bit == '1' ? mask : 0);
			
			mask <<= 1;
			pending = true;
			
			if (mask > 0xFF) {
				this.writeByte(currByte);
				currByte = 0;
				mask = 1;
				pending = false;
			}
		}
		
		if (pending) {
			this.writeByte(currByte);			
		}
	},
	
	getPos: function() {
		return this._pos;
	},
	
	toBuffer: function() {
		return new Buffer(this._content);
	}
	
};

module.exports = BinWriter;