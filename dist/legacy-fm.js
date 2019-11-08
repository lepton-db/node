"use strict";
/**
 * An experimental JSON persistence file manager, that is probably inferior
 * to the commit-style implementation in use now
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
// Dependencies
var fs = require('fs');
var path = require('path');
var util = require('util');
var rl = require('readline');
var readFile = util.promisify(fs.readFile);
var writeFile = util.promisify(fs.writeFile);
var readDir = util.promisify(fs.readdir);
function fileManager(dirpath) {
    return {
        readTable: tableReader(dirpath),
        writeTable: tableWriter(dirpath),
        readAllTables: allTableReader(dirpath),
    };
}
exports.fileManager = fileManager;
/**
 * Given the path to a directory, create a function that can read data from
 * a single <table>.json file inside
 */
var tableReader = function (dirpath) { return function (table) { return __awaiter(void 0, void 0, void 0, function () {
    var filename, contents, data;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                filename = path.join(dirpath, table) + ".json";
                return [4 /*yield*/, readFile(filename, 'utf8').catch(function (e) { return e; })];
            case 1:
                contents = _a.sent();
                if (contents instanceof Error) {
                    return [2 /*return*/, [null, tableNotExistsError(filename)]];
                }
                data = safeJsonParse(contents);
                if (data instanceof Error) {
                    return [2 /*return*/, [null, tableCorruptionError(filename)]];
                }
                return [2 /*return*/, [data, null]];
        }
    });
}); }; };
/**
 * Given the path to a directory, create a function that can write data to
 * a single <table>.json file inside
 */
var tableWriter = function (dirpath) { return function (table, data) { return __awaiter(void 0, void 0, void 0, function () {
    var filename, json, results;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                filename = path.join(dirpath, table) + ".json";
                json = JSON.stringify(data, null, 2);
                return [4 /*yield*/, writeFile(filename, json).catch(function (e) { return e; })];
            case 1:
                results = _a.sent();
                if (results instanceof Error) {
                    return [2 /*return*/, [null, tableNotExistsError(filename)]];
                }
                return [2 /*return*/, [json, null]];
        }
    });
}); }; };
/**
 * Given the path to a directory, create a function that can read data from
 * all <table>.json files inside
 */
var allTableReader = function (dirpath) { return function () { return __awaiter(void 0, void 0, void 0, function () {
    var files, jsonFiles, tableNames, data, readTable, _i, tableNames_1, tableName, _a, records, err;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0: return [4 /*yield*/, readDir(dirpath)];
            case 1:
                files = _b.sent();
                jsonFiles = files.filter(function (f) { return f.slice(-5) == '.json'; });
                tableNames = jsonFiles.map(function (f) { return f.slice(0, -5); });
                data = {};
                readTable = tableReader(dirpath);
                _i = 0, tableNames_1 = tableNames;
                _b.label = 2;
            case 2:
                if (!(_i < tableNames_1.length)) return [3 /*break*/, 5];
                tableName = tableNames_1[_i];
                return [4 /*yield*/, readTable(tableName)];
            case 3:
                _a = _b.sent(), records = _a[0], err = _a[1];
                if (err)
                    return [2 /*return*/, [null, err]];
                data[tableName] = records;
                _b.label = 4;
            case 4:
                _i++;
                return [3 /*break*/, 2];
            case 5: return [2 /*return*/, [data, null]];
        }
    });
}); }; };
// JSON.parse() without throwing
function safeJsonParse(str) {
    try {
        return JSON.parse(str);
    }
    catch (e) {
        return e;
    }
}
// New Error Type
function tableNotExistsError(filename) {
    var e = new Error("Expected " + filename + " to exist");
    e.name = 'TableNotExistsErr';
    return e;
}
// New Error Type
function tableCorruptionError(filename) {
    var e = new Error("Expected " + filename + " to contain valid JSON");
    e.name = 'TableCorruptionError';
    return e;
}
//# sourceMappingURL=legacy-fm.js.map