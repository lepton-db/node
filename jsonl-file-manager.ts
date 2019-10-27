// Dependencies
const fs = require('fs');
const path = require('path');
const util = require('util');
const rl = require('readline');
const { id } = require('./id');
const appendFile = util.promisify(fs.appendFile);

export function fileManager(dirpath) {
  return {
    commit: makeCommiter(dirpath),
  }
}

const makeCommiter = dirpath => async (table, mutation, payload) => {
  const datafile = path.join(dirpath, 'commits.jsonl');
  const commit = { id: id(), table, mutation, payload };
  const result = await appendFile(datafile, JSON.stringify(commit) + '\n');
  if (result instanceof Error) {
    return [null, commitError(datafile, commit)]
  }
  return [commit, null];
}

// JSON.parse() without throwing
function safeJsonParse(str) {
  try { return JSON.parse(str) }
  catch (e) { return e }
}

// New Error Type
function commitError(datafile, commit) {
  const e = new Error(`
    Could not apply commit: ${JSON.stringify(commit)} to datafile ${datafile}
  `.trim());
  e.name = 'CommitError';
  return e;
}
