export interface Commit {
  id: string
  timestamp: string
  table: string
  mutation: string
  payload: any
}

export interface CommitMaterial {
  table: string
  mutation: string
  payload: any
}

export interface ReadableTable {
  [id:string]: object
}

export interface ReadableDatabase {
  [table:string]: ReadableTable
}

export interface FileManager {
  commit: (cm:CommitMaterial) => Promise<Error|Commit>
  rebuild: () => Promise<Error|ReadableDatabase>
}
