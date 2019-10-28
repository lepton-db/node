// USAGE:
// const data = database('/data');

// data.commit(
//   data.define('actors', {
//     cash: data.num,
//   }),
//   data.define('positions', {
//     cash: data.num,
//     actorId: data.ref('actors'),
//     symbol: data.str,
//     quantity: data.int
//   }),
//   data.define('transactions', {
//     actorId: data.ref('actors'),
//     timestamp: data.iso,
//     action: data.enum('buy', 'sell'),
//     symbol: data.str,
//     quantity: data.int,
//     price: data.num,
//   }),
// )

import {
  Commit,
  CommitMaterial,
  FileManager,
  ReadOnlyDatabase
} from './entities';
import { fileManager } from './file-manager';

export async function database(dirpath) {
  const fm = fileManager(dirpath)
  const data = await fm.rebuild();
  if (data instanceof Error) throw data;

  return {
    define,
    commit: makeCommiter(fm, data),
    read: (table:string) => readOnly(data[table]),
  }
}

function define(table, fields): CommitMaterial {
  return { table, mutation: 'define' }
}

function readOnly(table) {
  const copy = {}
  for (const [id, fields] of Object.entries(table)) {
    copy[id] = { ...fields }
  }
  return copy;
}

function makeCommiter(fm:FileManager, data:ReadOnlyDatabase) {
  return async function(cm:CommitMaterial): Promise<Error|Commit> {
    const commit = await fm.commit(cm);
    if (commit instanceof Error) return commit;

    if (cm.mutation == 'define') {
      const { ...fields } = cm.payload;
      data[cm.table] = {};
    }

    if (cm.mutation == 'create') {
      const { id, ...fields } = cm.payload;
      data[cm.table][id] = fields;
    }

    if (cm.mutation == 'update') {
      const { id, ...newFields } = cm.payload;
      const { ...oldFields } = data[cm.table][id];
      data[cm.table][id] = { ...oldFields, ...newFields };
    }

    if (cm.mutation == 'delete') {
      delete data[cm.table][cm.payload.id]
    }
  }
}
