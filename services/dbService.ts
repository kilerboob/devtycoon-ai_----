import { GameState } from '../types';
import { INITIAL_GAME_STATE } from '../constants';

const DB_NAME = 'DevTycoonDB_v1';
const STORE_NAME = 'gameState';
const DB_VERSION = 6; // Bump: ensure all stores exist

class DBService {
  private db: IDBDatabase | null = null;

  private logError(operation: string, err: unknown, meta?: object) {
    try {
      // Preserve stack and message when available
      if (err instanceof Error) {
        console.error(`[DBService:${operation}]`, err.message, { stack: err.stack, ...meta });
      } else {
        console.error(`[DBService:${operation}]`, err, meta);
      }
    } catch (e) {
      // Fallback defensive logging
      console.error(`[DBService:${operation}] logging failed`, e);
    }
  }

  // Initialize the database connection
  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        this.logError('init.open', (event as any).error || event, { dbName: DB_NAME, version: DB_VERSION });
        reject("Failed to open database");
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        // When a versionchange occurs elsewhere, close this connection so upgrade can happen
        try {
          this.db.onversionchange = () => {
            console.warn('[DBService:init] version change detected, closing DB connection');
            this.db?.close();
          };
        } catch {}
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Ensure game state store exists
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }

        // Ensure devFS store has the correct schema (keyPath: 'id').
        // Some older databases may have been created without a keyPath, which causes
        // "out-of-line keys" errors when calling put(value) without explicit key.
        try {
          if (db.objectStoreNames.contains('devFS')) {
            // Recreate to guarantee correct keyPath
            db.deleteObjectStore('devFS');
          }
        } catch (e) {
          // If deletion fails for any reason, log and continue to create fresh store
          console.warn('[DBService:onupgradeneeded] Failed to delete old devFS store, recreating anyway', e);
        }
        db.createObjectStore('devFS', { keyPath: 'id' });

        // Create or recreate devFS_versions store for version history with indexes
        try {
          if (db.objectStoreNames.contains('devFS_versions')) {
            db.deleteObjectStore('devFS_versions');
          }
        } catch (e) {
          console.warn('[DBService:onupgradeneeded] Failed to delete old devFS_versions store, recreating anyway', e);
        }
        const verStore = db.createObjectStore('devFS_versions', { keyPath: 'id' });
        try { verStore.createIndex('byFile', 'filePath', { unique: false }); } catch {}
        try { verStore.createIndex('byFileTime', ['filePath', 'timestamp'], { unique: false }); } catch {}

        // LAYER 4: Shards store for server selection
        if (!db.objectStoreNames.contains('shards')) {
          db.createObjectStore('shards', { keyPath: 'id' });
        }
      };

      // If another tab holds the DB open at an older version, this upgrade may be blocked
      request.onblocked = () => {
        console.warn('[DBService:init] Upgrade blocked by another open connection. Close other tabs to proceed.');
      };
    });
  }

  // Save the entire game state
  async saveGame(state: GameState): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("Database not initialized");

      const transaction = this.db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      // We store the state with a fixed ID 'player1' for now
      // Clone via JSON to strip any functions/proxy objects
      try {
        const cleanState = JSON.parse(JSON.stringify(state));
        const request = store.put({ id: 'player1', ...cleanState });

        request.onerror = (ev) => {
          this.logError('saveGame.put', (ev as any).error || ev, { store: STORE_NAME });
          reject("Failed to save game");
        };
        request.onsuccess = () => resolve();
      } catch (e) {
        this.logError('saveGame.serialize', e);
        reject("Serialization failed");
      }
    });
  }

  // Load the game state
  async loadGame(): Promise<GameState | null> {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) return reject("Database not initialized");

      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get('player1');

      request.onerror = (ev) => {
        this.logError('loadGame.get', (ev as any).error || ev, { key: 'player1' });
        reject("Failed to load game");
      };
      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result);
        } else {
          resolve(null);
        }
      };
    });
  }

  async hasSave(): Promise<boolean> {
    if (!this.db) await this.init();
    return new Promise((resolve) => {
      if (!this.db) return resolve(false);
      const transaction = this.db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.count('player1');
      request.onsuccess = () => resolve(request.result > 0);
      request.onerror = (ev) => {
        this.logError('hasSave.count', (ev as any).error || ev);
        resolve(false);
      };
    });
  }

  // Reset progress
  async deleteSave(): Promise<void> {
      if (!this.db) await this.init();
      return new Promise((resolve, reject) => {
        if (!this.db) return reject("Database not initialized");
        const transaction = this.db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete('player1');
        request.onsuccess = () => resolve();
        request.onerror = (ev) => {
          this.logError('deleteSave.delete', (ev as any).error || ev);
          reject("Delete failed");
        };
      });
  }

  // Generic add method for any store
  async add<T>(storeName: string, value: T, key?: IDBValidKey): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("Database not initialized");
      try {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        // Use put() to upsert — this avoids "add" failing when the key already exists.
        // Choose call signature based on whether the store uses in-line keys (keyPath) or out-of-line keys (no keyPath)
        const hasInlineKeys = store.keyPath !== null; // string | DOMStringList vs null
        let request: IDBRequest<IDBValidKey> | IDBRequest<unknown>;
        if (hasInlineKeys) {
          // For in-line keys, do NOT provide the key parameter
          request = store.put(value as any);
        } else {
          // For out-of-line keys, provide an explicit key
          let effectiveKey = key;
          if (effectiveKey === undefined && (value as any) && (value as any).id !== undefined) {
            effectiveKey = (value as any).id as IDBValidKey;
          }
          request = effectiveKey !== undefined ? store.put(value as any, effectiveKey) : store.put(value as any);
        }
        request.onsuccess = () => resolve();
        request.onerror = (ev) => {
          const err: any = (ev as any).error || ev;
          this.logError('add.put', err, { store: storeName, key });
          // Propagate a more descriptive error to callers for easier debugging in UI
          const msg = err && err.message ? err.message : String(err);
          reject(`Failed to add to ${storeName}${msg ? `: ${msg}` : ''}`);
        };
      } catch (e) {
        this.logError('add', e, { store: storeName, key });
        const msg = e instanceof Error ? e.message : String(e);
        reject(`Failed to add to ${storeName}${msg ? `: ${msg}` : ''}`);
      }
    });
  }

  // Generic get method for any store
  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("Database not initialized");
      try {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (ev) => {
          this.logError('get', (ev as any).error || ev, { store: storeName, key });
          reject(`Failed to get from ${storeName}`);
        };
      } catch (e) {
        this.logError('get', e, { store: storeName, key });
        reject(`Failed to get from ${storeName}`);
      }
    });
  }

  // Generic getAll method for any store
  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("Database not initialized");
      try {
        const transaction = this.db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = (ev) => {
          this.logError('getAll', (ev as any).error || ev, { store: storeName });
          reject(`Failed to get all from ${storeName}`);
        };
      } catch (e) {
        this.logError('getAll', e, { store: storeName });
        reject(`Failed to get all from ${storeName}`);
      }
    });
  }

  // Generic delete method for any store
  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      if (!this.db) return reject("Database not initialized");
      try {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);
        request.onsuccess = () => resolve();
        request.onerror = (ev) => {
          this.logError('delete', (ev as any).error || ev, { store: storeName, key });
          reject(`Failed to delete from ${storeName}`);
        };
      } catch (e) {
        this.logError('delete', e, { store: storeName, key });
        reject(`Failed to delete from ${storeName}`);
      }
    });
  }
}

export const dbService = new DBService();