"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isNum = function (field) { return typeof field == 'number'; };
exports.isStr = function (field) { return typeof field == 'string'; };
exports.isBool = function (field) { return typeof field == 'boolean'; };
exports.isInt = function (field) { return Number.isInteger(field); };
exports.isIso = function (field) { return field == new Date(field).toISOString(); };
exports.isEnum = function () {
    var values = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        values[_i] = arguments[_i];
    }
    return function (field) { return values.includes(field); };
};
//# sourceMappingURL=validator.js.map