export type FileChangeStatus = 'added' | 'modified' | 'deleted';

export interface ChangedFile {
  path: string;
  status: FileChangeStatus;
}

export interface CommitRecord {
  sha: string;
  message: string;
  author: string;
  date: string;
}

export interface IGitAdapter {
  clone(repoUrl: string, localPath: string): Promise<void>;
  pull(localPath: string): Promise<void>;
  listChangedFiles(localPath: string, since?: string): Promise<ChangedFile[]>;
  readFile(localPath: string, relativePath: string): Promise<string>;
  getCommitSha(localPath: string): Promise<string>;
  getFileHistory(localPath: string, relativePath: string): Promise<CommitRecord[]>;
}
