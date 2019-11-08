"use strict";
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
var database_1 = require("./database");
function databaseCreationTest() {
    return __awaiter(this, void 0, void 0, function () {
        var data, newActors, actorIds, newTransactions, transactionIds, updatedActor, actorsAfterDeletion, results;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, database_1.database(__dirname + '/data')];
                case 1:
                    data = _a.sent();
                    if (!data)
                        throw new Error('Expected database client to exist');
                    // Define Tables
                    return [4 /*yield*/, data.commit(data.define('actors', {
                            referenceField: 'actorId'
                        }), data.define('transactions', {
                            referenceField: 'transactionId'
                        }), data.define('positions', {
                            referenceField: 'positionId'
                        }))];
                case 2:
                    // Define Tables
                    _a.sent();
                    // Expect newly created tables to exist, and be empty
                    ['actors', 'transactions', 'positions'].forEach(function (table) {
                        var records = data.read(table);
                        if (!records || records.length) {
                            throw new Error("Expected " + table + " to be an empty object.\n        Found " + JSON.stringify(records) + " instead.");
                        }
                    });
                    return [4 /*yield*/, data.commit(data.create('actors', {
                            fields: {
                                cash: 6500.54
                            }
                        }), data.create('actors', {
                            fields: {
                                cash: 1000
                            }
                        }), data.create('actors', {
                            fields: {
                                cash: 2400.78
                            }
                        }))];
                case 3:
                    newActors = _a.sent();
                    actorIds = Object.keys(newActors);
                    if (actorIds.length != 3) {
                        throw new Error("\n      Expected 3 records to be affected by creating new actor records.\n      Instead found " + actorIds.length + "\n    ");
                    }
                    if (newActors[actorIds[0]].cash !== 6500.54) {
                        throw new Error("\n      Expected the first actor's cash property to be 6500.54.\n      Instead found " + newActors[actorIds[0]].cash + "\n    ");
                    }
                    return [4 /*yield*/, data.commit(data.create('transactions', {
                            fields: {
                                actorId: actorIds[0],
                                timestamp: "2019-10-26T15:42:37.667Z",
                                action: "buy",
                                symbol: "AAPL",
                                quantity: 4,
                                price: 246.58
                            }
                        }), data.create('transactions', {
                            fields: {
                                actorId: actorIds[0],
                                timestamp: "2019-10-26T15:42:37.667Z",
                                action: "buy",
                                symbol: "MSFT",
                                quantity: 7,
                                price: 140.73
                            }
                        }), data.create('transactions', {
                            fields: {
                                actorId: actorIds[1],
                                timestamp: "2019-10-27T16:51:15.340Z",
                                action: "buy",
                                symbol: "TSLA",
                                quantity: 2,
                                price: 300.05
                            }
                        }))];
                case 4:
                    newTransactions = _a.sent();
                    transactionIds = Object.keys(newTransactions);
                    if (transactionIds.length != 3) {
                        throw new Error("\n      Expected 3 records to be affected by creating new transaction records.\n      Instead found " + transactionIds.length + "\n    ");
                    }
                    if (newTransactions[transactionIds[0]].symbol !== "AAPL") {
                        throw new Error("\n      Expected the first transaction's symbol property to be \"AAPL\".\n      Instead found " + newTransactions[transactionIds[0]].symbol + "\n    ");
                    }
                    // Populate position
                    return [4 /*yield*/, data.commit(data.create('positions', {
                            fields: {
                                actorId: actorIds[0],
                                symbol: "MSFT",
                                quantity: 7
                            }
                        }), data.create('positions', {
                            fields: {
                                actorId: actorIds[0],
                                symbol: "AAPL",
                                quantity: 4
                            }
                        }), data.create('positions', {
                            fields: {
                                actorId: actorIds[1],
                                symbol: "TSLA",
                                quantity: 2
                            }
                        }))
                        // Update Actor
                    ];
                case 5:
                    // Populate position
                    _a.sent();
                    // Update Actor
                    return [4 /*yield*/, data.commit(data.update('actors', {
                            id: actorIds[0],
                            fields: {
                                "cash": 3000,
                            }
                        }))];
                case 6:
                    // Update Actor
                    _a.sent();
                    if (newActors[actorIds[0]].cash !== 6500.54) {
                        throw new Error("\n      Expected an actor's cash property to be unchanged at 6500.54 after\n      updating without re-reading. Instead found " + newActors[actorIds[0]].cash + "\n    ");
                    }
                    updatedActor = data.read('actors')[actorIds[0]];
                    if (updatedActor.cash !== 3000) {
                        throw new Error("\n      Expected an actor's cash property to have changed to 3000 after\n      updating and re-reading. Instead found " + updatedActor.cash + "\n    ");
                    }
                    // Delete Actor
                    return [4 /*yield*/, data.commit(data.destroy('actors', {
                            id: actorIds[2],
                        }))];
                case 7:
                    // Delete Actor
                    _a.sent();
                    actorsAfterDeletion = Object.keys(data.read('actors'));
                    if (actorsAfterDeletion.length != 2) {
                        throw new Error("\n      Expected 2 actor records to exist after deleting 1.\n      Instead found " + actorIds.length + "\n    ");
                    }
                    results = data.find({
                        actors: {
                            where: function (id, actor) { return id == actorIds[0]; },
                            limit: 1,
                        },
                        positions: {
                            where: function (id, position) { return position.actorId == actorIds[0]; },
                            limit: 1,
                        },
                        transactions: {
                            where: function (id, transaction) { return transaction.actorId == actorIds[0]; },
                            limit: 1,
                        },
                    });
                    // data.find() should return an object, and each value should be an Array
                    Object.values(results).forEach(function (records) {
                        if (!Array.isArray(records)) {
                            throw new Error("\n        Expected the results of data.find() to be an object with Arrays\n        as values. Instead found " + JSON.stringify(records) + "\n      ");
                        }
                    });
                    return [2 /*return*/];
            }
        });
    });
}
module.exports.tests = [
    databaseCreationTest,
];
//# sourceMappingURL=create.test.js.map