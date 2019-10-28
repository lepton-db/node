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

export interface Table {
  [id:string]: Record
}

export type CommitEffects = Array<Error | Record | undefined>

export interface ReadOnlyDatabase {
  [table:string]: Table
}

export interface FileManager {
  commit: (...cms:CommitMaterial[]) => Promise<Error|undefined>
  rebuild: () => Promise<Error|ReadOnlyDatabase>
}
