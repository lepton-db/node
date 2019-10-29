import {
  CommitMaterial,
  FileManager,
  Database,
  ReadOnlyDatabase,
  Table,
  Record,
  RecordPayload,
  idLookup,
} from './entities';
import { fileManager } from './file-manager';
import { base36 } from './id';

// Used to create a git-like database that only reads from disk once on startup.
// All other reads are from memory, and mutations are relatively fast.
// Being git-like means that the database can potentially be restored to any
// previous point in it's history.
export async function database(dirpath): Promise<Database> {
  const fm = fileManager(dirpath)
  const data = await fm.rebuild();
  if (data instanceof Error) throw data;

  return {
    read: (table:string) => readOnly(data[table]),
    id: id => makeIdGetter(data)(id),
    graph: id => makeGraphGetter(data)(id),
    define,
    create: (table:string, fields:Record) => makeCreator(data)(table, fields),
    update,
    destroy,
    commit: makeCommiter(fm, data),
  }
}

// Return a copy of a table for reading.
// Mutating it will not affect the original.
function readOnly(table) {
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

function makeGraphGetter(data:ReadOnlyDatabase) {
  return function(id:string) {
    const { record, table } = makeIdGetter(data)(id);
    const graph:any = { ...record };
    for (const [foreignTable, records] of Object.entries(data)) {
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
function makeIdGetter(data:ReadOnlyDatabase) {
  return function (id:string): idLookup|undefined {
    for (const [table, records] of Object.entries(data)) {
      if (records[id]) return { record: records[id], table };
    }
  }
}

// Create CommitMaterial that can be used to define new tables
function define(table:string): CommitMaterial {
  return { table, mutation: 'define' };
}

// Guarantee that no id collisions occur
function idGenerator(data:ReadOnlyDatabase) {
  return function() {
    let id = base36();
    for (const records of Object.values(data)) {
      if (records[id]) return idGenerator(data)();
    }
    return id;
  }
}

// Given a database, create a function that can be used to generate
// CommitMaterial with a mutation value of "create".
// Ultimately, this will be used to create new records with no id collisions
function makeCreator(data:ReadOnlyDatabase) {
  return function create(table:string, fields:Record): CommitMaterial {
    const id = idGenerator(data)();
    return {
      table,
      mutation: 'create',
      payload: { id, ...fields },
    }
  }
}

// Create CommitMaterial that can be used to update existing records
function update(table:string, fields:RecordPayload): CommitMaterial {
  return {
    table,
    mutation: 'update',
    payload: fields,
  }
}

// Create CommitMaterial that can be used to delete existing records
function destroy(table:string, fields:RecordPayload): CommitMaterial {
  return {
    table,
    mutation: 'destroy',
    payload: fields,
  }
}

// Create a function that can use CommitMaterial to persist mutations to file
function makeCommiter(fm:FileManager, data:ReadOnlyDatabase) {
  return async function(...cms:CommitMaterial[]): Promise<Error|Table> {
    const affectedRecords = {};

    // Apply mutations to file
    const write = await fm.commit(...cms);
    if (write instanceof Error) return write;
    
    // Apply mutations to memory
    cms.forEach(async cm => {
      if (cm.mutation == 'define') {
        data[cm.table] = {};
      }
      else if (cm.mutation == 'create') {
        const { id, ...fields } = cm.payload;
        data[cm.table][id] = fields;
        affectedRecords[id] = fields;
      }
      else if (cm.mutation == 'update') {
        const { id, ...newFields } = cm.payload;
        const { ...oldFields } = data[cm.table][id];
        const updated = { ...oldFields, ...newFields };
        data[cm.table][id] = updated;
        affectedRecords[id] = updated;
      }
      else if (cm.mutation == 'destroy') {
        delete data[cm.table][cm.payload.id]
      }
    })
    return affectedRecords;
  }
}
