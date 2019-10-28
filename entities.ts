export interface Commit {
  id: string
  timestamp: string
  table: string
  mutation: string
  payload: any
}

export interface CommitMaterial {
  table: string
  mutation: 'define' | 'create' | 'update' | 'delete'
  payload: RecordPayload | DefinitionPayload
}

export interface Record {
  [field:string]: number | string | boolean
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

export interface ReadOnlyTable {
  [id:string]: Record
}

export interface ReadOnlyDatabase {
  [table:string]: ReadOnlyTable
}

export interface FileManager {
  commit: (cm:CommitMaterial) => Promise<Error|Commit>
  rebuild: () => Promise<Error|ReadOnlyDatabase>
}
