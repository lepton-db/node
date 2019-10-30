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
  payload?: any
}

export interface DefinitionPayload {
  referenceField: string 
}

export interface CreationPayload {
  fields: Record
}

export interface UpdatePayload {
  id: string
  fields: Record
}

export interface DestructionPayload {
  id: string
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
  define: (table:string, { referenceField:string }) => CommitMaterial
  create: (table:string, { fields:Record }) => CommitMaterial
  update: (table:string, { id:string, fields:Record }) => CommitMaterial
  destroy: (table:string, { id:string }) => CommitMaterial
  commit: (...cms:CommitMaterial[]) => Promise<Error|Table>
}
