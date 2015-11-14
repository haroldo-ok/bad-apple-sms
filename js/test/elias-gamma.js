"use strict";

describe("appending strings", function() {
    it("should be able to encode a number", function() {
        expect(EliasGamma.encodeNumber).toBeDefined();
    });
    it("should encode the numbers correctly", function() {
		var table = [
			[1, "1"],
			[2, "010"],
			[3, "011"],
			[4, "00100"],
			[5, "00101"],
			[6, "00110"],
			[7, "00111"],
			[8, "0001000"],
			[9, "0001001"],
			[10, "0001010"],
			[11, "0001011"],
			[12, "0001100"],
			[13, "0001101"],
			[14, "0001110"],
			[15, "0001111"],
			[16, "000010000"],
			[17, "000010001"],
		];

		table.forEach(function(row){
			expect(EliasGamma.encodeNumber(row[0])).toEqual(row[1]);
		});
    });
});