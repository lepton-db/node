// Dependencies
const fs = require('fs');
const path = require('path');
const util = require('util');
const rl = require('readline');
const id = require('./id');
const appendFile = util.promisify(fs.appendFile);

export function fileManager(dirpath) {
  return {
    commit: makeCommiter(dirpath),
    rebuild: makeRebuilder(dirpath),
  }
}

const makeCommiter = dirpath => async (table, mutation, payload) => {
  const datafile = path.join(dirpath, 'commits.jsonl');
  const commit = { id: id.base36(), table, mutation, payload };
  const commitStr = JSON.stringify(commit) + '\n';
  const result = await appendFile(datafile, commitStr).catch(e => e);
  if (result instanceof Error) {
    return [null, commitError(datafile, commit)]
  }
  return [commit, null];
}

const makeRebuilder = dirpath => async (): Promise<any[]> => {
  const datafile = path.join(dirpath, 'commits.jsonl');
  const data = {};
  
  return new Promise(async (resolve, reject) => {
    // Configure Input Stream
    const input = withoutThrowing(fs.createReadStream, datafile)
    if (input instanceof Error) return [null, rebuildError(datafile)]
    const lines = rl.createInterface({ input });
    
    // Read the commit file line by line, parsing each as JSON
    lines.on('line', line => {
      const commit = JSON.parse(line);
      if (commit.mutation == 'create') {
        if (!data[commit.table]) data[commit.table] = {};
        const { id, ...rest  } = commit.payload;
        data[commit.table][id] = { ...rest };
      }
    })

    lines.on('error', error => reject([null, rebuildError(datafile)]))
    lines.on('close', () => resolve([data, null]));
  })
}

function rebuildError(datafile) {
  const e = new Error('Could not rebuild from commit history');
  e.name = 'RebuildError';
  return e;
}

function withoutThrowing(fn, ...args) {
  try { return fn(...args) }
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
