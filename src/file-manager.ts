// Dependencies
const fs = require('fs');
const path = require('path');
const util = require('util');
const rl = require('readline');
const LineReader = require('n-readlines');
const { base36 } = require('./id');
const appendFile = util.promisify(fs.appendFile);
import {
  CommitMaterial,
  ReadOnlyDatabase
} from './entities';

export function fileManager(dirpath) {
  const datafile = path.join(dirpath, '.commits');
  if (!fs.existsSync(datafile)) fs.writeFileSync(datafile, '');

  return {
    commit: makeCommiter(datafile),
    rebuild: makeSyncRebuilder(datafile),
  }
}

function makeCommiter(datafile) {
  return async function(...cms:CommitMaterial[]): Promise<Error|undefined> {

    // A string containing multiple lines of commits
    const lines = cms.map(cm => {
      const { table, mutation, payload } = cm;
      const id = base36();
      const timestamp = new Date().toISOString();
      const commit = { id, timestamp, table, mutation, payload };
      return JSON.stringify(commit) + '\n';
    }).join('');
    
    // Append the string to the commit file
    const result = await appendFile(datafile, lines).catch(e => e);
    if (result instanceof Error) {
      return commitError(datafile, cms);
    }
  }
}

const makeRebuilder = datafile => async (): Promise<Error|ReadOnlyDatabase> => {
  const data = {};
  const meta = {};
  
  return new Promise(async (resolve, reject) => {
    // Configure Input Stream
    const input = withoutThrowing(fs.createReadStream, datafile)
    if (input instanceof Error) return [null, rebuildError(datafile)]
    const lines = rl.createInterface({ input });
    
    // Read the commit file line by line, parsing each as JSON
    lines.on('line', line => {
      const commit = JSON.parse(line);

      if (commit.mutation == 'define') {
        data[commit.table] = {};
        meta[commit.table] = {};
        meta[commit.table].referenceField = commit.payload.referenceField;
      }
      if (commit.mutation == 'create') {
        const { id, fields } = commit.payload;
        data[commit.table][id] = fields;
      }
      if (commit.mutation == 'alter') {
        const { id, fields: newFields } = commit.payload;
        const { ...oldFields } = data[commit.table][id];
        data[commit.table][id] = { ...oldFields, ...newFields };
      }
      if (commit.mutation == 'destroy') {
        delete data[commit.table][commit.payload.id]
      }

    })

    lines.on('error', e => reject(rebuildError(datafile)))
    lines.on('close', () => resolve({ data, meta }));
  })
}

const makeSyncRebuilder = datafile => (): Error|ReadOnlyDatabase => {
  // Return values
  const data = {};
  const meta = {};

  const lines = new LineReader(datafile);

  // Re-apply each mutation in the commit history
  while (true) {
    let line = lines.next();
    if (!line) break;
    const commit = JSON.parse(line);

    if (commit.mutation == 'define') {
      data[commit.table] = {};
      meta[commit.table] = {};
      meta[commit.table].referenceField = commit.payload.referenceField;
    }
    if (commit.mutation == 'create') {
      const { id, fields } = commit.payload;
      data[commit.table][id] = fields;
    }
    if (commit.mutation == 'alter') {
      const { id, fields: newFields } = commit.payload;
      const { ...oldFields } = data[commit.table][id];
      data[commit.table][id] = { ...oldFields, ...newFields };
    }
    if (commit.mutation == 'destroy') {
      delete data[commit.table][commit.payload.id]
    }
  }
  return { data, meta };
}

function rebuildError(datafile:string) {
  const e = new Error('Could not rebuild from commit history');
  e.name = 'RebuildError';
  return e;
}

function withoutThrowing(fn, ...args) {
  try { return fn(...args) }
  catch (e) { return e }
}

// New Error Type
function commitError(datafile:string, cms:CommitMaterial[]) {
  const e = new Error(`
    Could not apply commits: ${JSON.stringify(cms)} to datafile ${datafile}
  `.trim());
  e.name = 'CommitError';
  return e;
}
