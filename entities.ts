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

export interface ReadOnlyTable {
  [id:string]: object
}

export interface ReadOnlyDatabase {
  [table:string]: ReadOnlyTable
}

export interface FileManager {
  commit: (cm:CommitMaterial) => Promise<Error|Commit>
  rebuild: () => Promise<Error|ReadOnlyDatabase>
}
