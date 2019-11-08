"use strict";
/**
 * Generate probabilistically unique ids
 */
Object.defineProperty(exports, "__esModule", { value: true });
var crypto_1 = require("crypto");
function hex() {
    return crypto_1.randomBytes(32).toString('hex');
}
exports.hex = hex;
var random = function (min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; };
var base36digits = '01234567890abcdefghijklmnopqrstuvwxyz'.split('');
function base36(length) {
    if (length === void 0) { length = 16; }
    var str = '';
    for (var i = 0; i < length; i++) {
        str += base36digits[random(0, base36digits.length - 1)];
    }
    return str;
}
exports.base36 = base36;
//# sourceMappingURL=id.js.map