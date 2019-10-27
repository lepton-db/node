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