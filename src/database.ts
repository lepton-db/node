import {
  CommitMaterial,
  FileManager,
  Database,
  ReadOnlyDatabase,
  Table,
  idLookup,
  DestructionPayload,
  AlterationPayload,
  CreationPayload,
  FindOptions,
  UserFacingRecord,
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
  
  // A method that can use commit material to apply persistence changes
  const commit = makeCommiter(fm, db);

  return {
    read: (table:string) => readOnly(db.data[table]),
    id: makeIdGetter(db),
    graph: makeGraphGetter(db),
    find: makeFind(db),
    define: makeDefiner(commit),
    create: makeCreator(db, commit),
    alter: makeAlterer(db, commit),
    destroy: makeDestroyer(commit),
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
        if (!where || where(id, record)) results[table].push({ id, ...record });
      }
    }
    return results;
  }
}

function makeDefiner(commit) {
  // Create CommitMaterial that can be used to define new tables
  return async function define(table:string, options: { referenceField: string }) {
    const cm: CommitMaterial = { table, mutation: 'define', payload: options };
    return await commit(cm)
  }
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
function makeCreator(data:ReadOnlyDatabase, commit) {
  return async function create(table:string, payload:CreationPayload) {
    const { fields } = payload;
    if (!fields) throw new Error('payload must have a "fields" property');
    const id = idGenerator(data)();
    const cm: CommitMaterial = {
      table,
      mutation: 'create',
      payload: { id, fields},
    }
    return await commit(cm);
  }
}

function makeAlterer(data:ReadOnlyDatabase, commit) {
  // Create CommitMaterial that can be used to update existing records
  return async function alter(
    table:string,
    payload:AlterationPayload
  ): Promise<[UserFacingRecord[], Error[]]> {

    if (!payload.fields) {
      throw new Error('payload must have a "fields" property');
    }
    if (!payload.id && !payload.where) {
      throw new Error('payload must have "id" or "where" property');
    }

    const results = [];
    const errs = [];

    if (payload.id) {
      const cm: CommitMaterial = {
        table,
        mutation: 'alter',
        payload: { id: payload.id, fields: payload.fields }
      }
      const [result, err] = await commit(cm);
      if (result) results.push(result);
      if (err) errs.push(err);
    }

    else if (payload.where) {
      Object.entries(data[table]).forEach(async ([id, fields]) => {
        if (payload.where(fields)) {
          const cm: CommitMaterial = {
            table,
            mutation: 'alter',
            payload: { id, fields: payload.fields }
          }
          const [result, err] = await commit(cm);
          if (result) results.push(result);
          if (err) errs.push(err);
        }
      })
    }

    return [results, errs]
  }
}

function makeDestroyer(commit) {
  // Create CommitMaterial that can be used to delete existing records
  return async function destroy(table:string, payload:DestructionPayload) {
    if (!payload.id) throw new Error('payload must have an "id" property');
    const cm: CommitMaterial = {
      table,
      mutation: 'destroy',
      payload,
    }
    return commit(cm);
  }
}


// Create a function that can use CommitMaterial to persist mutations to file
function makeCommiter(fm:FileManager, db:ReadOnlyDatabase) {
  return async function(cm:CommitMaterial): Promise<[any, Error?]> {

    // Don't allow mutations to tables that don't exist
    if (cm.mutation !== 'define' && !db.data[cm.table]) {
      throw new Error(`The target table "${cm.table}" does not exist`);
    }

    // Apply mutations to file
    const write = await fm.commit(cm);
    if (write instanceof Error) {
      const err = new Error(
        `A write failure has caused a database desync.`
        )
      return [null, err];
    }

    // Apply mutations to memory
    if (cm.mutation == 'define') {
      db.data[cm.table] = {};
      db.meta[cm.table] = {};
      db.meta[cm.table].referenceField = cm.payload.referenceField;
      return [db.data[cm.table], null];
    }
    else if (cm.mutation == 'create') {
      const { id, fields } = cm.payload;
      db.data[cm.table][id] = fields;
      return [{id, ...fields }, null];
    }
    else if (cm.mutation == 'alter') {
      const { id, fields: newFields } = cm.payload;
      const { ...oldFields } = db.data[cm.table][id];
      const altered = { ...oldFields, ...newFields };
      db.data[cm.table][id] = altered;
      return [{ id, ...altered }, null];
    }
    else if (cm.mutation == 'destroy') {
      const record = db.data[cm.table][cm.payload.id];
      if (record) {
        delete db.data[cm.table][cm.payload.id]
        return [{ id: cm.payload.id, ...record }, null];
      } else {
        const err = new Error(
          `Could not delete record ${cm.payload.id} from table ${cm.table}, `
          +  `because it does not exist.`
        );
        return [null, err];
      }
    }
  }
}
