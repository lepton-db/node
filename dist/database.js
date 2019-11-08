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
var file_manager_1 = require("./file-manager");
var id_1 = require("./id");
// Used to create a git-like database that only reads from disk once on startup.
// All other reads are from memory, and mutations are relatively fast.
// Being git-like means that the database can potentially be restored to any
// previous point in it's history.
function database(dirpath) {
    return __awaiter(this, void 0, void 0, function () {
        var fm, db;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    fm = file_manager_1.fileManager(dirpath);
                    return [4 /*yield*/, fm.rebuild()];
                case 1:
                    db = _a.sent();
                    if (db instanceof Error)
                        throw db;
                    return [2 /*return*/, {
                            read: function (table) { return readOnly(db.data[table]); },
                            id: makeIdGetter(db),
                            graph: makeGraphGetter(db),
                            find: makeFind(db),
                            define: define,
                            create: makeCreator(db),
                            update: update,
                            destroy: destroy,
                            commit: makeCommiter(fm, db),
                        }];
            }
        });
    });
}
exports.database = database;
// Return a copy of a table for reading.
// Mutating it will not affect the original.
function readOnly(table) {
    if (!table)
        return table;
    var copy = {};
    for (var _i = 0, _a = Object.entries(table); _i < _a.length; _i++) {
        var _b = _a[_i], id = _b[0], fields = _b[1];
        copy[id] = __assign({}, fields);
    }
    return copy;
}
// Create an object that represents a record and all its relationships
function makeGraphGetter(db) {
    return function (id) {
        var _a = makeIdGetter(db)(id), record = _a.record, table = _a.table;
        var graph = __assign({}, record);
        var referenceField = db.meta[table].referenceField;
        // Look for the reference field in all other records
        for (var _i = 0, _b = Object.entries(db.data); _i < _b.length; _i++) {
            var _c = _b[_i], foreignTable = _c[0], records = _c[1];
            for (var _d = 0, _e = Object.values(records); _d < _e.length; _d++) {
                var foreignRecord = _e[_d];
                for (var _f = 0, _g = Object.keys(foreignRecord); _f < _g.length; _f++) {
                    var foreignField = _g[_f];
                    // See if the field is a reference to the original record
                    if (foreignField == referenceField) {
                        if (!graph[foreignTable])
                            graph[foreignTable] = [];
                        delete foreignRecord[referenceField];
                        graph[foreignTable].push(foreignRecord);
                    }
                }
            }
        }
        return graph;
    };
}
// Get a record by id from any table it may be in
function makeIdGetter(db) {
    return function (id) {
        for (var _i = 0, _a = Object.entries(db.data); _i < _a.length; _i++) {
            var _b = _a[_i], table = _b[0], records = _b[1];
            if (records[id])
                return { record: records[id], table: table };
        }
    };
}
function makeFind(db) {
    return function join(findOptions) {
        var results = {};
        for (var _i = 0, _a = Object.entries(findOptions); _i < _a.length; _i++) {
            var _b = _a[_i], table = _b[0], options = _b[1];
            var where = options.where, limit = options.limit;
            var targetTable = db.data[table];
            if (!targetTable)
                continue;
            results[table] = [];
            for (var _c = 0, _d = Object.entries(targetTable); _c < _d.length; _c++) {
                var _e = _d[_c], id = _e[0], record = _e[1];
                if (limit && results[table].length >= limit)
                    break;
                if (!where || where(id, record))
                    results[table].push(record);
            }
        }
        return results;
    };
}
// Create CommitMaterial that can be used to define new tables
function define(table, options) {
    return { table: table, mutation: 'define', payload: options };
}
// Guarantee that no id collisions occur
function idGenerator(db) {
    return function () {
        var id = id_1.base36();
        for (var _i = 0, _a = Object.values(db.data); _i < _a.length; _i++) {
            var records = _a[_i];
            if (records[id])
                return idGenerator(db)();
        }
        return id;
    };
}
// Given a database, create a function that can be used to generate
// CommitMaterial with a mutation value of "create".
// Ultimately, this will be used to create new records with no id collisions
function makeCreator(data) {
    return function create(table, payload) {
        var fields = payload.fields;
        if (!fields)
            throw new Error('payload must have a "fields" property');
        var id = idGenerator(data)();
        return {
            table: table,
            mutation: 'create',
            payload: { id: id, fields: fields },
        };
    };
}
// Create CommitMaterial that can be used to update existing records
function update(table, payload) {
    if (!payload.id)
        throw new Error('payload must have an "id" property');
    if (!payload.fields)
        throw new Error('payload must have a "fields" property');
    return {
        table: table,
        mutation: 'update',
        payload: payload,
    };
}
// Create CommitMaterial that can be used to delete existing records
function destroy(table, payload) {
    if (!payload.id)
        throw new Error('payload must have an "id" property');
    return {
        table: table,
        mutation: 'destroy',
        payload: payload,
    };
}
// Create a function that can use CommitMaterial to persist mutations to file
function makeCommiter(fm, db) {
    return function () {
        var cms = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            cms[_i] = arguments[_i];
        }
        return __awaiter(this, void 0, void 0, function () {
            var affectedRecords, write;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        affectedRecords = {};
                        return [4 /*yield*/, fm.commit.apply(fm, cms)];
                    case 1:
                        write = _a.sent();
                        if (write instanceof Error)
                            return [2 /*return*/, write];
                        // Apply mutations to memory
                        cms.forEach(function (cm) { return __awaiter(_this, void 0, void 0, function () {
                            var _a, id, fields, _b, id, newFields, oldFields, updated;
                            return __generator(this, function (_c) {
                                if (cm.mutation == 'define') {
                                    db.data[cm.table] = {};
                                    db.meta[cm.table] = {};
                                    db.meta[cm.table].referenceField = cm.payload.referenceField;
                                }
                                else if (cm.mutation == 'create') {
                                    _a = cm.payload, id = _a.id, fields = _a.fields;
                                    db.data[cm.table][id] = fields;
                                    affectedRecords[id] = fields;
                                }
                                else if (cm.mutation == 'update') {
                                    _b = cm.payload, id = _b.id, newFields = _b.fields;
                                    oldFields = __rest(db.data[cm.table][id], []);
                                    updated = __assign(__assign({}, oldFields), newFields);
                                    db.data[cm.table][id] = updated;
                                    affectedRecords[id] = updated;
                                }
                                else if (cm.mutation == 'destroy') {
                                    delete db.data[cm.table][cm.payload.id];
                                }
                                return [2 /*return*/];
                            });
                        }); });
                        return [2 /*return*/, affectedRecords];
                }
            });
        });
    };
}
//# sourceMappingURL=database.js.map