"use strict";

describe("appending strings", function() {
	var encodingExamples = [
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
	
    it("should be able to encode a number", function() {
        expect(EliasGamma.encodeNumber).toBeDefined();
    });
    it("should encode the numbers correctly", function() {
		encodingExamples.forEach(function(row){
			expect(EliasGamma.encodeNumber(row[0])).toEqual(row[1]);
		});
    });
	
    it("should be able to decode a number", function() {
        expect(EliasGamma.decodeNumber).toBeDefined();
    });
    it("should decode the numbers correctly", function() {
		encodingExamples.forEach(function(row){
			expect(EliasGamma.decodeNumber(row[1])).toEqual(row[0]);
		});
    });
	
    it("should encode an array of numbers correctly", function() {
		expect(EliasGamma.encodeNumberArray([8, 17])).toEqual("0001000000010001");
    });
    it("should decode an array of numbers correctly", function() {
		expect(EliasGamma.decodeNumberArray("0001000000010001")).toEqual([8, 17]);
    });
});