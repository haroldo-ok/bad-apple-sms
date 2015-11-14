"use strict";

describe("appending strings", function() {
    it("should be able to encode a number", function() {
        expect(EliasGamma.encodeNumber).toBeDefined();
    });
    it("should encode the numbers correctly", function() {
		var table = [
			[1, "1"],
			[2, "010"]
		];

		table.forEach(function(row){
			expect(EliasGamma.encodeNumber(row[0])).toEqual(row[1]);
		});
    });
});