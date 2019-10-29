export interface Commit {
  id: string
  timestamp: string
  table: string
  mutation: string
  payload: any
}

export interface CommitMaterial {
  table: string
  mutation: 'define' | 'create' | 'update' | 'destroy'
  payload?: RecordPayload
}

// Commit payload for defining new tables
export interface DefinitionPayload {
  [field:string]: any
}

// Commit payload for most mutation types
export interface RecordPayload {
  id: string
  [field:string]: number | string | boolean
}

export interface Record {
  [field:string]: number | string | boolean
}

export interface idLookup {
  record:Record
  table:string
}

export interface Table {
  [id:string]: Record
}

// This may never be seen by a module user?
export interface ReadOnlyDatabase {
  [table:string]: Table
}

// Module that handles persistence details
export interface FileManager {
  commit: (...cms:CommitMaterial[]) => Promise<Error|undefined>
  rebuild: () => Promise<Error|ReadOnlyDatabase>
}

// The interface that users of the module will interact with
export interface Database {
  read: (table:string) => Table
  id: (id:string) => idLookup|undefined
  graph?: any // experimental
  define: (table:string) => CommitMaterial
  create: (table:string, fields:Record) => CommitMaterial
  update: (table:string, fields:RecordPayload) => CommitMaterial
  destroy: (table:string, fields:RecordPayload) => CommitMaterial
  commit: (...cms:CommitMaterial[]) => Promise<Error|Table>
}
