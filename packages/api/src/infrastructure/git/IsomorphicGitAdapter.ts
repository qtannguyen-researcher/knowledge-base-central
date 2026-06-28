import * as git from 'isomorphic-git';
import * as fs from 'fs';
import * as path from 'path';
import http from 'isomorphic-git/http/node';

import type { ChangedFile, CommitRecord, IGitAdapter } from '../../domain/git-sync/IGitAdapter.js';

export class IsomorphicGitAdapter implements IGitAdapter {
  async clone(repoUrl: string, localPath: string): Promise<void> {
    const dir = localPath;

    if (fs.existsSync(dir)) {
      fs.rmSync(dir, { recursive: true, force: true });
    }

    fs.mkdirSync(dir, { recursive: true });

    await git.clone({
      fs,
      http,
      dir,
      url: repoUrl,
      depth: 50,
      singleBranch: true,
      ref: 'main',
    });
  }

  async pull(localPath: string): Promise<void> {
    await git.pull({
      fs,
      http,
      dir: localPath,
      fastForwardOnly: true,
    });
  }

  async listChangedFiles(localPath: string, since?: string): Promise<ChangedFile[]> {
    const commits = await git.log({
      fs,
      dir: localPath,
      depth: since ? 100 : 1,
    });

    const changedFiles: ChangedFile[] = [];
    const seenFiles = new Set<string>();

    if (since) {
      const sinceIndex = commits.findIndex((c) => c.oid.startsWith(since));
      const rangeEnd = sinceIndex >= 0 ? sinceIndex : commits.length;

      for (let i = 0; i < rangeEnd; i++) {
        const commit = commits[i];
        const parentOid = commits[i + 1]?.oid;

        const files = await git.walk({
          fs,
          gitdir: path.join(localPath, '.git'),
          trees: [git.TREE({ ref: parentOid || 'HEAD~1' }), git.TREE({ ref: commit.oid })],
          map: async function (_filepath, _head, _working) {
            return _working;
          },
        });

        for (const entry of files) {
          if (entry && entry.type === 'blob' && entry.path) {
            const relPath = entry.path;
            if (!seenFiles.has(relPath)) {
              seenFiles.add(relPath);
              changedFiles.push({
                path: relPath,
                status: i === 0 ? 'added' : 'modified',
              });
            }
          }
        }
      }
    } else if (commits.length > 0) {
      const headOid = commits[0].oid;
      const files = await git.walk({
        fs,
        gitdir: path.join(localPath, '.git'),
        trees: [git.TREE({ ref: headOid })],
        map: async function (_filepath, _head) {
          return _head;
        },
      });

      for (const entry of files) {
        if (entry && entry.type === 'blob' && entry.path) {
          changedFiles.push({
            path: entry.path,
            status: 'added',
          });
        }
      }
    }

    return changedFiles;
  }

  async readFile(localPath: string, relativePath: string): Promise<string> {
    const fullPath = path.join(localPath, relativePath);
    return fs.readFileSync(fullPath, 'utf-8');
  }

  async getCommitSha(localPath: string): Promise<string> {
    const head = await git.resolveRef({
      fs,
      dir: localPath,
      ref: 'HEAD',
    });
    return head.substring(0, 7);
  }

  async getFileHistory(localPath: string, relativePath: string): Promise<CommitRecord[]> {
    const commits = await git.log({
      fs,
      dir: localPath,
      depth: 50,
    });

    const history: CommitRecord[] = [];

    for (const commit of commits) {
      try {
        await git.readBlob({
          fs,
          dir: localPath,
          oid: commit.oid,
          filepath: relativePath,
        });

        const authorLine = commit.commit.author;
        const authorName =
          typeof authorLine === 'string' ? authorLine : authorLine?.name || 'Unknown';

        history.push({
          sha: commit.oid.substring(0, 7),
          message: commit.commit.message,
          author: authorName,
          date: new Date(commit.commit.author.timestamp * 1000).toISOString(),
        });
      } catch {
        // File might not exist in this commit, skip it
      }
    }

    return history;
  }
}
