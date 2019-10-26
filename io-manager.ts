// Dependencies
const fs = require('fs');
const path = require('path');
const util = require('util');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

function database(dirpath) {
  return {
    read: reader(dirpath),
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

const write = dirpath => async (table, data) => {
  const filename = path.join(dirpath, table) + ".json";
  const json = JSON.stringify(data);
  // Try to read file
  const results = await writeFile(filename, json).catch(e => e);
  if (results instanceof Error) {
    return [null, tableNotExistsError(filename)];
  }
  return [data, null];
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

(async function() {
  const db = database(__dirname + '/data');
  const [actors, err] = await db.read('actors');
  console.log({ actors, err })
})()
