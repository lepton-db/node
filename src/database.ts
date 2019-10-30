import {
  CommitMaterial,
  FileManager,
  Database,
  ReadOnlyDatabase,
  Table,
  Record,
  idLookup,
  DestructionPayload,
  UpdatePayload,
  CreationPayload,
} from './entities';
import { fileManager } from './file-manager';
import { base36 } from './id';

// Used to create a git-like database that only reads from disk once on startup.
// All other reads are from memory, and mutations are relatively fast.
// Being git-like means that the database can potentially be restored to any
// previous point in it's history.
export async function database(dirpath): Promise<Database> {
  const fm = fileManager(dirpath)
  const db = await fm.rebuild();
  if (db instanceof Error) throw db;
  const { data, meta } = db;

  return {
    read: (table:string) => readOnly(data[table]),
    id: id => makeIdGetter(db)(id),
    graph: id => makeGraphGetter(db)(id),
    define,
    create: (table:string, options:{ fields:Record }) => makeCreator(db)(table, options),
    update,
    destroy,
    commit: makeCommiter(fm, db),
  }
}

// Return a copy of a table for reading.
// Mutating it will not affect the original.
function readOnly(table) {
  if (!table) return table;
  const copy = {}
  for (const [id, fields] of Object.entries(table)) {
    copy[id] = { ...fields }
  }
  return copy;
}

// Determine if a field is acting as a foreign key
function isReference(name:string): boolean {
  return name.slice(-2) == 'Id';
}

// Determine the table that a foreign key is referencing
function referenceTable(name:string): string {
  return name.slice(0, -2);
}

function makeGraphGetter(db:ReadOnlyDatabase) {
  return function(id:string) {
    const { record, table } = makeIdGetter(db)(id);
    const graph:any = { ...record };
    for (const [foreignTable, records] of Object.entries(db.data)) {
      for (const foreignRecord of Object.values(records)) {
        for (const foreignField of Object.keys(foreignRecord)) {
          if (foreignField == table + 'Id') {
            if (!graph[foreignTable]) graph[foreignTable] = [];
            delete foreignRecord[table + 'Id'];
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
  return {
    table,
    mutation: 'update',
    payload,
  }
}

// Create CommitMaterial that can be used to delete existing records
function destroy(table:string, payload:DestructionPayload): CommitMaterial {
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

    // Apply mutations to file
    const write = await fm.commit(...cms);
    if (write instanceof Error) return write;
    
    // Apply mutations to memory
    cms.forEach(async cm => {
      if (cm.mutation == 'define') {
        db.data[cm.table] = {};
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
    return affectedRecords;
  }
}
