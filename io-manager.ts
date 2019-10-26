// Dependencies
const fs = require('fs');
const path = require('path');
const util = require('util');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

export function database(dirpath) {
  return {
    read: reader(dirpath),
    write: writer(dirpath),
  }
}

const reader = dirpath => async table => {
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

const writer = dirpath => async (table, data) => {
  const filename = path.join(dirpath, table) + ".json";
  const json = JSON.stringify(data, null, 2);
  // Try to read file
  const results = await writeFile(filename, json).catch(e => e);
  if (results instanceof Error) {
    return [null, tableNotExistsError(filename)];
  }
  return [json, null];
}

function safeJsonParse(str) {
  try { return JSON.parse(str) }
  catch (e) { return e }
}

function tableNotExistsError(filename) {
  const e = new Error(`Expected ${filename} to exist`);
  e.name = 'TableNotExistsErr';
  return e;
}

function tableCorruptionError(filename) {
  const e = new Error(`Expected ${filename} to contain valid JSON`);
  e.name = 'TableCorruptionError';
  return e;
}

// (async function() {
//   const db = database(__dirname + '/data');
//   const data = [
//     {
//       "id": "a6320da84fabd25487377283b03b4c54",
//       "cash": 1000.50
//     }
//   ];
//   const [actors, err] = await db.write('actors', data);
//   console.log({ actors, err })
// })()

// (async function() {
//   const db = database(__dirname + '/data');
//   const [actors, err] = await db.read('actors');
//   console.log({ actors, err })
// })()
