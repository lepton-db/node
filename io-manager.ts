// Dependencies
const fs = require('fs');
const path = require('path');
const util = require('util');
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);
const asyncParseJson = util.promisify(JSON.parse);

function database(dirpath) {
  return {
    read: reader(dirpath),
  }
}

const reader = dirpath => async (table) => {
  const filename = path.join(dirpath, table) + ".json";
  // Try to read file
  const contents = await readFile(filename).catch(e => e);
  if (contents instanceof Error) {
    return [null, tableNotExistsError(filename)];
  }
  // Try to parse JSON
  const data = await asyncParseJson(contents).catch(e => e);
  if (data instanceof Error) {
    return [null, tableCorruptionError(filename)];
  }
  return [data, null];
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
