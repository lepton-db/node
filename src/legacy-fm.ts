/**
 * An experimental JSON persistence file manager, that is probably inferior
 * to the commit-style implementation in use now
 */

// Dependencies
const fs = require('fs');
const path = require('path');
const util = require('util');
const rl = require('readline');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const readDir = util.promisify(fs.readdir);

export function fileManager(dirpath) {
  return {
    readTable: tableReader(dirpath),
    writeTable: tableWriter(dirpath),
    readAllTables: allTableReader(dirpath),
  }
}

/**
 * Given the path to a directory, create a function that can read data from
 * a single <table>.json file inside
 */
const tableReader = dirpath => async table => {
  const filename = path.join(dirpath, table) + ".json";
  // Try to read file
  const contents = await readFile(filename, 'utf8').catch(e => e);
  if (contents instanceof Error) {
    return [null, tableNotExistsError(filename)];
  }
  // Try to parse JSON
  const data = safeJsonParse(contents);
  if (data instanceof Error) {
    return [null, tableCorruptionError(filename)];
  }
  return [data, null];
}

/**
 * Given the path to a directory, create a function that can write data to
 * a single <table>.json file inside
 */
const tableWriter = dirpath => async (table, data) => {
  const filename = path.join(dirpath, table) + ".json";
  const json = JSON.stringify(data, null, 2);
  // Try to read file
  const results = await writeFile(filename, json).catch(e => e);
  if (results instanceof Error) {
    return [null, tableNotExistsError(filename)];
  }
  return [json, null];
}

/**
 * Given the path to a directory, create a function that can read data from 
 * all <table>.json files inside
 */
const allTableReader = dirpath => async () => {
  const files = await readDir(dirpath);
  const jsonFiles = files.filter(f => f.slice(-5) == '.json');
  const tableNames = jsonFiles.map(f => f.slice(0, -5));

  const data = {};
  const readTable = tableReader(dirpath);

  // TODO: Use a non-blocking loop
  for (const tableName of tableNames) {
    const [records, err] = await readTable(tableName);
    if (err) return [null, err];
    data[tableName] = records;
  }
  return [data, null];
}

// JSON.parse() without throwing
function safeJsonParse(str) {
  try { return JSON.parse(str) }
  catch (e) { return e }
}

// New Error Type
function tableNotExistsError(filename) {
  const e = new Error(`Expected ${filename} to exist`);
  e.name = 'TableNotExistsErr';
  return e;
}

// New Error Type
function tableCorruptionError(filename) {
  const e = new Error(`Expected ${filename} to contain valid JSON`);
  e.name = 'TableCorruptionError';
  return e;
}
