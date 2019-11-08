"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
// Dependencies
var fs = require('fs');
var path = require('path');
var util = require('util');
var rl = require('readline');
var base36 = require('./id').base36;
var appendFile = util.promisify(fs.appendFile);
function fileManager(dirpath) {
    return {
        commit: makeCommiter(dirpath),
        rebuild: makeRebuilder(dirpath),
    };
}
exports.fileManager = fileManager;
function makeCommiter(dirpath) {
    return function () {
        var cms = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            cms[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var datafile, lines, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        datafile = path.join(dirpath, '.commits');
                        lines = cms.map(function (cm) {
                            var table = cm.table, mutation = cm.mutation, payload = cm.payload;
                            var id = base36();
                            var timestamp = new Date().toISOString();
                            var commit = { id: id, timestamp: timestamp, table: table, mutation: mutation, payload: payload };
                            return JSON.stringify(commit) + '\n';
                        }).join('');
                        return [4 /*yield*/, appendFile(datafile, lines).catch(function (e) { return e; })];
                    case 1:
                        result = _a.sent();
                        if (result instanceof Error) {
                            return [2 /*return*/, commitError(datafile, cms)];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
}
var makeRebuilder = function (dirpath) { return function () { return __awaiter(void 0, void 0, void 0, function () {
    var datafile, data, meta;
    return __generator(this, function (_a) {
        datafile = path.join(dirpath, '.commits');
        data = {};
        meta = {};
        return [2 /*return*/, new Promise(function (resolve, reject) { return __awaiter(void 0, void 0, void 0, function () {
                var input, lines;
                return __generator(this, function (_a) {
                    input = withoutThrowing(fs.createReadStream, datafile);
                    if (input instanceof Error)
                        return [2 /*return*/, [null, rebuildError(datafile)]];
                    lines = rl.createInterface({ input: input });
                    // Read the commit file line by line, parsing each as JSON
                    lines.on('line', function (line) {
                        var commit = JSON.parse(line);
                        if (commit.mutation == 'define') {
                            data[commit.table] = {};
                            meta[commit.table] = {};
                            meta[commit.table].referenceField = commit.payload.referenceField;
                        }
                        if (commit.mutation == 'create') {
                            var _a = commit.payload, id = _a.id, fields = _a.fields;
                            data[commit.table][id] = fields;
                        }
                        if (commit.mutation == 'update') {
                            var _b = commit.payload, id = _b.id, newFields = _b.fields;
                            var oldFields = __rest(data[commit.table][id], []);
                            data[commit.table][id] = __assign(__assign({}, oldFields), newFields);
                        }
                        if (commit.mutation == 'destroy') {
                            delete data[commit.table][commit.payload.id];
                        }
                    });
                    lines.on('error', function (e) { return reject(rebuildError(datafile)); });
                    lines.on('close', function () { return resolve({ data: data, meta: meta }); });
                    return [2 /*return*/];
                });
            }); })];
    });
}); }; };
function rebuildError(datafile) {
    var e = new Error('Could not rebuild from commit history');
    e.name = 'RebuildError';
    return e;
}
function withoutThrowing(fn) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    try {
        return fn.apply(void 0, args);
    }
    catch (e) {
        return e;
    }
}
// New Error Type
function commitError(datafile, cms) {
    var e = new Error(("\n    Could not apply commits: " + JSON.stringify(cms) + " to datafile " + datafile + "\n  ").trim());
    e.name = 'CommitError';
    return e;
}
//# sourceMappingURL=file-manager.js.map