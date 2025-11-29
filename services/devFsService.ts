import { dbService } from './dbService';
import { DevFile, DevFolder, DevFSEntry, DevFSVersion } from '../types';
import { v4 as uuidv4 } from 'uuid';

const FS_STORE_NAME = 'devFS';

// File system event types
export type FSEventType = 'create' | 'update' | 'delete' | 'rename';

// File watcher callback type
export type FSWatcherCallback = (event: {
  type: FSEventType;
  path: string;
  oldPath?: string;
  timestamp: number;
  entry?: DevFSEntry;
}) => void;

class DevFsService {
  private listeners: Map<string, Set<FSWatcherCallback>> = new Map();
  private globalListeners: Set<FSWatcherCallback> = new Set();
  // Initialize the file system with a root directory if it doesn't exist
  async init() {
    try {
      const root = await this.getEntry('/');
      if (!root) {
        const rootFolder: DevFolder = {
          id: '/',
          name: '/',
          type: 'folder',
          parentId: null,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
  await dbService.add(FS_STORE_NAME, rootFolder);
        console.info('[DevFsService:init] created root folder');
      }
      
      // Create default system folders if they don't exist
      const systemFolders = ['/projects', '/sites', '/storage', '/apps'];
      for (const folderPath of systemFolders) {
        const folder = await this.getEntry(folderPath);
        if (!folder) {
          await this.createFolder(folderPath);
          console.info(`[DevFsService:init] created system folder: ${folderPath}`);
        }
      }
    } catch (e) {
      console.error('[DevFsService:init] failed to initialize devFS', e);
      throw e;
    }
  }

  // Get a file or folder by its path
  async getEntry(path: string): Promise<DevFSEntry | undefined> {
    try {
      return await dbService.get(FS_STORE_NAME, path);
    } catch (e) {
      console.error('[DevFsService:getEntry]', { path, error: e });
      throw e;
    }
  }

  // List contents of a folder
  async listFolder(path: string): Promise<DevFSEntry[]> {
    try {
  const allEntries = await dbService.getAll<DevFSEntry>(FS_STORE_NAME);
      const parent = await this.getEntry(path);
      if (!parent || parent.type !== 'folder') {
        return [];
      }
      return allEntries.filter(entry => entry.parentId === parent.id);
    } catch (e) {
      console.error('[DevFsService:listFolder]', { path, error: e });
      throw e;
    }
  }

  // Create a new file
  async createFile(path: string, content: string = ''): Promise<DevFile> {
    try {
      const parentPath = this.getParentPath(path);
      const name = this.getNameFromPath(path);
      const parent = await this.getEntry(parentPath);

      if (!parent || parent.type !== 'folder') {
        throw new Error(`Parent directory not found at ${parentPath}`);
      }
      // If file exists and content is different, capture a version snapshot BEFORE overwrite
      const existing = await this.getEntry(path);
      if (existing && existing.type === 'file') {
        const prev = existing as DevFile;
        if ((prev.content || '') !== (content || '')) {
          try {
            const rec: DevFSVersion = { id: uuidv4(), filePath: path, timestamp: Date.now(), content: prev.content || '', reason: 'update' };
            await dbService.add('devFS_versions', rec);
          } catch (verErr) { console.warn('[DevFsService:createFile] saveVersion failed', verErr); }
        }
      }

      const newFile: DevFile = {
        id: path,
        name,
        content,
        type: 'file',
        parentId: parent.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

  await dbService.add(FS_STORE_NAME, newFile);
      console.info('[DevFsService:createFile]', { path });
      
      // Emit file creation event
      this.emit({
        type: 'create',
        path,
        timestamp: Date.now(),
        entry: newFile,
      });
      
      return newFile;
    } catch (e) {
      console.error('[DevFsService:createFile] failed', { path, error: e });
      throw e;
    }
  }

  // Create a new folder
  async createFolder(path: string): Promise<DevFolder> {
    try {
      const parentPath = this.getParentPath(path);
      const name = this.getNameFromPath(path);
      const parent = await this.getEntry(parentPath);

      if (!parent || parent.type !== 'folder') {
        throw new Error(`Parent directory not found at ${parentPath}`);
      }

      const newFolder: DevFolder = {
        id: path,
        name,
        type: 'folder',
        parentId: parent.id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await dbService.add(FS_STORE_NAME, newFolder);
      console.info('[DevFsService:createFolder]', { path });

      // Emit folder creation event
      this.emit({
        type: 'create',
        path,
        timestamp: Date.now(),
        entry: newFolder,
      });

      return newFolder;
    } catch (e) {
      console.error('[DevFsService:createFolder] failed', { path, error: e });
      throw e;
    }
  }  // Delete an entry. If recursive is true and path is a folder, delete all children as well.
  async deleteEntry(path: string, recursive: boolean = false): Promise<void> {
    try {
      if (!recursive) {
        await dbService.delete('devFS', path);
        console.info('[DevFsService:deleteEntry] deleted', path);
        return;
      }

      // recursive delete optimized: use a cursor with a key range matching the prefix
      const prefix = path === '/' ? '/' : path.replace(/\/$/, '') + '/';

      // Open the DB directly to use a cursor for performance
      await new Promise<void>((resolve, reject) => {
        const req = indexedDB.open('DevTycoonDB_v1');
        req.onsuccess = (ev) => {
          const db = (ev.target as IDBOpenDBRequest).result as IDBDatabase;
          try {
            const tx = db.transaction(['devFS'], 'readwrite');
            const store = tx.objectStore('devFS');

            // Delete the exact path first if exists
            store.delete(path);

            // If prefix is '/' we delete everything (except maybe root handled above)
            if (prefix === '/') {
              const cursorReq = store.openCursor();
              cursorReq.onsuccess = (cEv) => {
                const cursor = (cEv.target as IDBRequest).result as IDBCursorWithValue | null;
                if (cursor) {
                  try { cursor.delete(); } catch (e) { console.warn('[DevFsService:deleteEntry] cursor delete failed', e); }
                  cursor.continue();
                }
              };
              cursorReq.onerror = () => { /* continue, but don't fail entire op */ };
            } else {
              // Build a range for keys that start with prefix
              const upper = prefix + '\uffff';
              const range = IDBKeyRange.bound(prefix, upper);
              const cursorReq = store.openCursor(range);
              cursorReq.onsuccess = (cEv) => {
                const cursor = (cEv.target as IDBRequest).result as IDBCursorWithValue | null;
                if (cursor) {
                  try { cursor.delete(); } catch (e) { console.warn('[DevFsService:deleteEntry] cursor delete failed', e); }
                  cursor.continue();
                }
              };
              cursorReq.onerror = () => { /* ignore individual cursor failures */ };
            }

            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = (te) => { console.warn('[DevFsService:deleteEntry] tx error', te); db.close(); resolve(); };
          } catch (err) {
            console.warn('[DevFsService:deleteEntry] cursor approach failed, falling back', err);
            db.close();
            resolve();
          }
        };
        req.onerror = () => {
          console.warn('[DevFsService:deleteEntry] open DB failed, fallback will be used');
          resolve();
        };
      });

      // Fallback: ensure anything remaining is removed via getAll filter
      try {
        const all = await dbService.getAll<DevFSEntry>('devFS');
        const remaining = all.filter(e => e.id === path || e.id.startsWith(prefix));
        for (const e of remaining) {
          try { await dbService.delete(FS_STORE_NAME, e.id); } catch (inner) { /* ignore */ }
        }
        console.info('[DevFsService:deleteEntry] recursive deleted (finalized)', path, remaining.length);

        // Emit delete events for each removed entry (so listeners can update)
        try {
          for (const rem of remaining) {
            try {
              this.emit({ type: 'delete', path: rem.id, timestamp: Date.now(), entry: rem });
            } catch (emitErr) {
              console.warn('[DevFsService:deleteEntry] emit failed for', rem.id, emitErr);
            }
          }
          // Emit a general delete for requested path as well
          try { this.emit({ type: 'delete', path, timestamp: Date.now() }); } catch (emitErr) { /* ignore */ }
        } catch (emitAllErr) {
          console.warn('[DevFsService:deleteEntry] emit loop failed', emitAllErr);
        }
      } catch (e) {
        console.warn('[DevFsService:deleteEntry] fallback getAll failed', e);
      }
    } catch (e) {
      console.error('[DevFsService:deleteEntry] failed', { path, recursive, error: e });
      throw e;
    }
  }

  // Rename/move an entry (file or folder). When renaming a folder, moves all children paths accordingly.
  async renameEntry(oldPath: string, newPath: string): Promise<void> {
    try {
      const entry = await this.getEntry(oldPath);
      if (!entry) throw new Error(`Entry not found: ${oldPath}`);

      // For folder: move children
      if (entry.type === 'folder') {
        const all = await dbService.getAll<DevFSEntry>(FS_STORE_NAME);
        const prefix = oldPath === '/' ? '/' : oldPath.replace(/\/$/, '') + '/';
        const toMove = all.filter(e => e.id === oldPath || e.id.startsWith(prefix));

        const movedEntries: DevFSEntry[] = [];
        for (const child of toMove) {
          const relative = child.id === oldPath ? '' : child.id.substring(prefix.length);
          const targetId = (newPath === '/' ? '' : newPath.replace(/\/$/, '')) + (relative ? `/${relative}` : '');
          const moved = { ...child, id: targetId } as any;
          // adjust parentId if present
          if ((child as any).parentId) {
            const childParent = (child as any).parentId;
            if (childParent === oldPath) {
              moved.parentId = newPath;
            } else if (childParent && childParent.startsWith(prefix)) {
              moved.parentId = newPath.replace(/\/$/, '') + '/' + childParent.substring(prefix.length);
            }
          }
          await dbService.add(FS_STORE_NAME, moved);
          movedEntries.push(moved as DevFSEntry);
        }

        // delete originals
        for (const child of toMove) {
          await dbService.delete(FS_STORE_NAME, child.id);
        }
        // emit rename/update events for moved entries
        try {
          for (const m of movedEntries) {
            try { this.emit({ type: 'update', path: m.id, timestamp: Date.now(), entry: m }); } catch (e) { /* ignore */ }
          }
        } catch (emitErr) { console.warn('[DevFsService:renameEntry] emit moved entries failed', emitErr); }
      } else {
        // file: simple upsert with new id, then delete old
        const moved = { ...entry, id: newPath, parentId: newPath === '/' ? '/' : newPath.replace(/\/[^/]*$/, '') || '/' } as any;
        await dbService.add(FS_STORE_NAME, moved);
        await dbService.delete(FS_STORE_NAME, oldPath);
        // emit update for moved file
        try { this.emit({ type: 'rename', path: newPath, oldPath, timestamp: Date.now(), entry: moved }); } catch (e) { /* ignore */ }
      }

      console.info('[DevFsService:renameEntry] renamed', oldPath, '->', newPath);
      // emit a rename event for the top-level path
      try { this.emit({ type: 'rename', path: newPath, oldPath, timestamp: Date.now() }); } catch (e) { /* ignore */ }
    } catch (e) {
      console.error('[DevFsService:renameEntry] failed', { oldPath, newPath, error: e });
      throw e;
    }
  }

  // ===================== PROJECT-SPECIFIC METHODS =====================

  // Save a project to DevFS
  async saveProject(projectId: string, projectData: any): Promise<void> {
    try {
      const projectPath = `/projects/${projectId}`;
      
      // Ensure /projects folder exists
      const projectsFolder = await this.getEntry('/projects');
      if (!projectsFolder) {
        await this.createFolder('/projects');
      }

      // Ensure project folder exists
      const projectFolder = await this.getEntry(projectPath);
      if (!projectFolder) {
        await this.createFolder(projectPath);
      }

      // Save project metadata as meta.json
      const metaPath = `${projectPath}/meta.json`;
      const metaContent = JSON.stringify(projectData, null, 2);
      
      const existingMeta = await this.getEntry(metaPath);
      if (existingMeta && existingMeta.type === 'file') {
        // Update existing file by overwriting with add (upsert)
        const updated = {
          ...(existingMeta as DevFile),
          content: metaContent,
          updatedAt: Date.now(),
        };
        await dbService.add(FS_STORE_NAME, updated);
      } else {
        // Create new file
        await this.createFile(metaPath, metaContent);
      }

      console.info('[DevFsService:saveProject] saved project', projectId);
    } catch (e) {
      console.error('[DevFsService:saveProject] failed', { projectId, error: e });
      throw e;
    }
  }

  // Load a single project from DevFS
  async loadProject(projectId: string): Promise<any | undefined> {
    try {
      const metaPath = `/projects/${projectId}/meta.json`;
      const metaFile = await this.getEntry(metaPath);

      if (!metaFile || metaFile.type !== 'file') {
        console.warn('[DevFsService:loadProject] project not found', projectId);
        return undefined;
      }

      const projectData = JSON.parse((metaFile as DevFile).content || '{}');
      console.info('[DevFsService:loadProject] loaded project', projectId);
      return projectData;
    } catch (e) {
      console.error('[DevFsService:loadProject] failed', { projectId, error: e });
      throw e;
    }
  }

  // Load all projects from /projects folder
  async loadAllProjects(): Promise<Array<{ id: string; data: any }>> {
    try {
      const projectsFolder = await this.getEntry('/projects');
      if (!projectsFolder) {
        console.info('[DevFsService:loadAllProjects] no projects folder found');
        return [];
      }

      const projectFolders = await this.listFolder('/projects');
      const projects: Array<{ id: string; data: any }> = [];

      for (const folder of projectFolders) {
        if (folder.type === 'folder') {
          const projectId = folder.name;
          const projectData = await this.loadProject(projectId);
          if (projectData) {
            projects.push({ id: projectId, data: projectData });
          }
        }
      }

      console.info('[DevFsService:loadAllProjects] loaded', projects.length, 'projects');
      return projects;
    } catch (e) {
      console.error('[DevFsService:loadAllProjects] failed', e);
      throw e;
    }
  }

  // Delete a project from DevFS
  async deleteProject(projectId: string): Promise<void> {
    try {
      const projectPath = `/projects/${projectId}`;
      await this.deleteEntry(projectPath);
      console.info('[DevFsService:deleteProject] deleted project', projectId);
    } catch (e) {
      console.error('[DevFsService:deleteProject] failed', { projectId, error: e });
      throw e;
    }
  }

  // Save project graph (VisualEditor data)
  async saveProjectGraph(projectId: string, graphData: any): Promise<void> {
    try {
      const projectPath = `/projects/${projectId}`;
      const graphPath = `${projectPath}/graph.json`;
      
      // Ensure project folder exists
      const projectFolder = await this.getEntry(projectPath);
      if (!projectFolder) {
        await this.createFolder(projectPath);
      }

      await this.createFile(graphPath, JSON.stringify(graphData));
      console.info('[DevFsService:saveProjectGraph] saved graph for project', projectId);
      // Notify watchers that graph was updated
      try {
        const saved = await this.getEntry(graphPath);
        this.emit({ type: 'update', path: graphPath, timestamp: Date.now(), entry: saved });
      } catch (emitErr) {
        console.warn('[DevFsService:saveProjectGraph] emit failed', emitErr);
      }
    } catch (e) {
      console.error('[DevFsService:saveProjectGraph] failed', { projectId, error: e });
      throw e;
    }
  }

  // Load project graph (VisualEditor data)
  async loadProjectGraph(projectId: string): Promise<any> {
    try {
      const graphPath = `/projects/${projectId}/graph.json`;
      const entry = await this.getEntry(graphPath);
      
      if (!entry || entry.type !== 'file') {
        console.warn('[DevFsService:loadProjectGraph] graph not found', projectId);
        return null;
      }

      const graphData = JSON.parse((entry as DevFile).content);
      console.info('[DevFsService:loadProjectGraph] loaded graph for project', projectId);
      return graphData;
    } catch (e) {
      console.error('[DevFsService:loadProjectGraph] failed', { projectId, error: e });
      throw e;
    }
  }

  // Save project file (for IDE code storage)
  async saveProjectFile(projectId: string, filename: string, content: string): Promise<void> {
    try {
      const projectPath = `/projects/${projectId}`;
      const filePath = `${projectPath}/${filename}`;
      
      // Ensure project folder exists
      const projectFolder = await this.getEntry(projectPath);
      if (!projectFolder) {
        await this.createFolder(projectPath);
      }

      await this.createFile(filePath, content);
      console.info('[DevFsService:saveProjectFile] saved file', filePath);
      // Notify watchers that file was updated
      try {
        const saved = await this.getEntry(filePath);
        this.emit({ type: 'update', path: filePath, timestamp: Date.now(), entry: saved });
      } catch (emitErr) {
        console.warn('[DevFsService:saveProjectFile] emit failed', emitErr);
      }
    } catch (e) {
      console.error('[DevFsService:saveProjectFile] failed', { projectId, filename, error: e });
      throw e;
    }
  }

  // Load project file
  async loadProjectFile(projectId: string, filename: string): Promise<string | null> {
    try {
      const filePath = `/projects/${projectId}/${filename}`;
      const entry = await this.getEntry(filePath);
      
      if (!entry || entry.type !== 'file') {
        console.warn('[DevFsService:loadProjectFile] file not found', filePath);
        return null;
      }

      const content = (entry as DevFile).content;
      console.info('[DevFsService:loadProjectFile] loaded file', filePath);
      return content;
    } catch (e) {
      console.error('[DevFsService:loadProjectFile] failed', { projectId, filename, error: e });
      throw e;
    }
  }

  // List project files
  async listProjectFiles(projectId: string): Promise<DevFSEntry[]> {
    try {
      const projectPath = `/projects/${projectId}`;
      const files = await this.listFolder(projectPath);
      console.info('[DevFsService:listProjectFiles] listed', files.length, 'files in', projectId);
      return files;
    } catch (e) {
      console.error('[DevFsService:listProjectFiles] failed', { projectId, error: e });
      throw e;
    }
  }

  // ===================== FILE WATCHER SYSTEM =====================

  /**
   * Register a listener for changes on a specific path or all paths
   * @param callback Function to call on file system events
   * @param path Optional path to watch. If undefined, watches all paths (global)
   * @returns Unsubscribe function
   */
  registerListener(callback: FSWatcherCallback, path?: string): () => void {
    if (!path) {
      // Global listener
      this.globalListeners.add(callback);
      return () => this.globalListeners.delete(callback);
    }

    // Path-specific listener
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Set());
    }
    this.listeners.get(path)!.add(callback);

    return () => {
      const set = this.listeners.get(path);
      if (set) {
        set.delete(callback);
        if (set.size === 0) {
          this.listeners.delete(path);
        }
      }
    };
  }

  /**
   * Unregister all listeners for a path or all listeners
   * @param path Optional path. If undefined, clears all listeners
   */
  unregisterListeners(path?: string): void {
    if (!path) {
      this.listeners.clear();
      this.globalListeners.clear();
      console.info('[DevFsService:unregisterListeners] Cleared all listeners');
      return;
    }

    this.listeners.delete(path);
    console.info('[DevFsService:unregisterListeners] Cleared listeners for', path);
  }

  /**
   * Emit a file system event to all relevant listeners
   * @private
   */
  private emit(event: Parameters<FSWatcherCallback>[0]): void {
    // Call global listeners
    this.globalListeners.forEach(callback => {
      try {
        callback(event);
      } catch (e) {
        console.error('[DevFsService:emit] Global listener error:', e);
      }
    });

    // Call path-specific listeners (exact match and parent paths)
    let currentPath = event.path;
    while (true) {
      const listeners = this.listeners.get(currentPath);
      if (listeners) {
        listeners.forEach(callback => {
          try {
            callback(event);
          } catch (e) {
            console.error('[DevFsService:emit] Path listener error for', currentPath, ':', e);
          }
        });
      }

      // Check parent paths
      if (currentPath === '/') break;
      currentPath = this.getParentPath(currentPath);
    }
  }

  // ===================== HELPER METHODS =====================

  // Helper to get parent path
  private getParentPath(path: string): string {
    if (path === '/') return '/';
    const parts = path.split('/').filter(p => p);
    parts.pop();
    return '/' + parts.join('/') || '/';
  }

  // Helper to get name from path
  private getNameFromPath(path: string): string {
    if (path === '/') return '/';
    return path.split('/').filter(p => p).pop() || '';
  }
}

export const devFsService = new DevFsService();

// =============== VERSIONING EXTENSIONS ===============
// Extend prototype with versioning APIs without changing public surface too much
export interface DevFsServiceExtensions {
  saveVersion(filePath: string, content: string, reason?: string): Promise<void>;
  getVersions(filePath: string, limit?: number): Promise<DevFSVersion[]>;
  restoreVersion(filePath: string, versionId: string): Promise<void>;
}

// Implementations on the instance via declaration merging
(devFsService as DevFsService & DevFsServiceExtensions).saveVersion = async (filePath: string, content: string, reason?: string) => {
  await dbService.init();
  const rec: DevFSVersion = {
    id: uuidv4(),
    filePath,
    timestamp: Date.now(),
    content,
    reason,
  };
  await dbService.add('devFS_versions', rec);
};

(devFsService as DevFsService & DevFsServiceExtensions).getVersions = async (filePath: string, limit: number = 20) => {
  await dbService.init();
  const all = await dbService.getAll<DevFSVersion>('devFS_versions');
  return all
    .filter(v => v.filePath === filePath)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
};

(devFsService as DevFsService & DevFsServiceExtensions).restoreVersion = async (filePath: string, versionId: string) => {
  await dbService.init();
  const ver = await dbService.get<DevFSVersion>('devFS_versions', versionId);
  if (!ver) throw new Error('Version not found');
  const existing = await (devFsService as DevFsService).getEntry(filePath);
  if (!existing || existing.type !== 'file') throw new Error('Target file not found');
  const prev = existing as DevFile;
  const updated: DevFile = {
    ...prev,
    content: ver.content,
    updatedAt: Date.now(),
  };
  await dbService.add('devFS', updated);
  try {
    (devFsService as any).emit({ type: 'update', path: filePath, timestamp: Date.now(), entry: updated });
  } catch {}
};
