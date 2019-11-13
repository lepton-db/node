import {
  CommitMaterial,
  FileManager,
  Database,
  ReadOnlyDatabase,
  Table,
  idLookup,
  DestructionPayload,
  UpdatePayload,
  CreationPayload,
  FindOptions,
} from './entities';
import { fileManager } from './file-manager';
import { base36 } from './id';

// Used to create a git-like database that only reads from disk once on startup.
// All other reads are from memory, and mutations are relatively fast.
// Being git-like means that the database can potentially be restored to any
// previous point in it's history.
export function database(dirpath): Database {
  const fm = fileManager(dirpath)
  const db = fm.rebuild();
  if (db instanceof Error) throw db;

  return {
    read: (table:string) => readOnly(db.data[table]),
    id: makeIdGetter(db),
    graph: makeGraphGetter(db),
    find: makeFind(db),
    define,
    create: makeCreator(db),
    update,
    destroy,
    commit: makeCommiter(fm, db),
  }
}

// Return a copy of a table for reading.
// Mutating it will not affect the original.
function readOnly(table:Table) {
  if (!table) return table;
  const copy:Table = {}
  for (const [id, fields] of Object.entries(table)) {
    copy[id] = { ...fields }
  }
  return copy;
}

// Create an object that represents a record and all its relationships
function makeGraphGetter(db:ReadOnlyDatabase) {
  return function(id:string) {
    const { record, table } = makeIdGetter(db)(id);
    const graph:any = { ...record };
    const { referenceField } = db.meta[table];

    // Look for the reference field in all other records
    for (const [foreignTable, records] of Object.entries(db.data)) {
      for (const foreignRecord of Object.values(records)) {
        for (const foreignField of Object.keys(foreignRecord)) {

          // See if the field is a reference to the original record
          if (foreignField == referenceField) {
            if (!graph[foreignTable]) graph[foreignTable] = [];
            delete foreignRecord[referenceField];
            graph[foreignTable].push(foreignRecord);
          }
        }
      }
    }
    return graph;
  }
}

// Get a record by id from any table it may be in
function makeIdGetter(db:ReadOnlyDatabase) {
  return function (id:string): idLookup|undefined {
    for (const [table, records] of Object.entries(db.data)) {
      if (records[id]) return { record: records[id], table };
    }
  }
}

function makeFind(db:ReadOnlyDatabase) {
  return function join(findOptions:FindOptions): { [table:string]: Table } {
    const results = {};
    for (const [table, options] of Object.entries(findOptions)) {
      const { where, limit } = options;

      const targetTable = db.data[table];
      if (!targetTable) continue;

      results[table] = [];
      for (const [id, record] of Object.entries(targetTable)) {
        if (limit && results[table].length >= limit) break;
        if (!where || where(id, record)) results[table].push(record);
      }
    }
    return results;
  }
}

// Create CommitMaterial that can be used to define new tables
function define(table:string, options: { referenceField: string }): CommitMaterial {
  return { table, mutation: 'define', payload: options };
}

// Guarantee that no id collisions occur
function idGenerator(db:ReadOnlyDatabase) {
  return function() {
    let id = base36();
    for (const records of Object.values(db.data)) {
      if (records[id]) return idGenerator(db)();
    }
    return id;
  }
}

// Given a database, create a function that can be used to generate
// CommitMaterial with a mutation value of "create".
// Ultimately, this will be used to create new records with no id collisions
function makeCreator(data:ReadOnlyDatabase) {
  return function create(table:string, payload:CreationPayload): CommitMaterial {
    const { fields } = payload;
    if (!fields) throw new Error('payload must have a "fields" property');
    const id = idGenerator(data)();
    return {
      table,
      mutation: 'create',
      payload: { id, fields},
    }
  }
}

// Create CommitMaterial that can be used to update existing records
function update(table:string, payload:UpdatePayload): CommitMaterial {
  if (!payload.id) throw new Error('payload must have an "id" property');
  if (!payload.fields) throw new Error('payload must have a "fields" property');
  return {
    table,
    mutation: 'update',
    payload,
  }
}

// Create CommitMaterial that can be used to delete existing records
function destroy(table:string, payload:DestructionPayload): CommitMaterial {
  if (!payload.id) throw new Error('payload must have an "id" property');
  return {
    table,
    mutation: 'destroy',
    payload,
  }
}

// Create a function that can use CommitMaterial to persist mutations to file
function makeCommiter(fm:FileManager, db:ReadOnlyDatabase) {
  return async function(...cms:CommitMaterial[]): Promise<Error|Table> {
    const affectedRecords = {};

    // Don't allow mutations to tables that don't exist
    cms.forEach(cm => {
      if (cm.mutation !== 'define' && !db.data[cm.table]) {
        throw new Error(`The target table "${cm.table}" does not exist`);
      }
    })

    // Apply mutations to memory
    cms.forEach(cm => {
      if (cm.mutation == 'define') {
        db.data[cm.table] = {};
        db.meta[cm.table] = {};
        db.meta[cm.table].referenceField = cm.payload.referenceField;
      }
      else if (cm.mutation == 'create') {
        const { id, fields } = cm.payload;
        db.data[cm.table][id] = fields;
        affectedRecords[id] = fields;
      }
      else if (cm.mutation == 'update') {
        const { id, fields: newFields } = cm.payload;
        const { ...oldFields } = db.data[cm.table][id];
        const updated = { ...oldFields, ...newFields };
        db.data[cm.table][id] = updated;
        affectedRecords[id] = updated;
      }
      else if (cm.mutation == 'destroy') {
        delete db.data[cm.table][cm.payload.id]
      }
    })

    // Apply mutations to file
    const write = await fm.commit(...cms);
    if (write instanceof Error) return write;
    return affectedRecords;
  }
}
