import { dbService } from './dbService';
import { DevFSEntry } from '../types';
import { v4 as uuidv4 } from 'uuid';

const FS_STORE = 'devFS';

/**
 * One-time migration helper that ensures each devFS entry has an `id` field.
 * For entries missing `id`, it attempts to derive an id from parentId+name
 * or falls back to a generated UUID path.
 */
export async function migrateEnsureIds(): Promise<{ migrated: number; total: number }> {
  try {
    const entries = await dbService.getAll<Partial<DevFSEntry>>(FS_STORE);
    let migrated = 0;

    for (const e of entries) {
      // If entry already has id, skip
      if ((e as any).id) continue;

      const name = (e as any).name || 'item';
      const parentId = (e as any).parentId || '/';
      // Derive id: parent/name or a uuid under /migrated
      let newId = '';
      try {
        if (parentId && parentId !== '/') {
          newId = `${parentId.replace(/\/$/, '')}/${name}`;
        } else {
          newId = `/${name}`;
        }
      } catch (_) {
        newId = `/migrated-${uuidv4()}`;
      }

      const fixed: any = { ...e, id: newId };
      // Upsert the fixed entry. Do NOT pass an explicit key when the objectStore
      // uses a keyPath (id) — this avoids DataError in some IndexedDB implementations.
      await dbService.add(FS_STORE, fixed);
      migrated++;
    }

    return { migrated, total: entries.length };
  } catch (err) {
    console.error('[devFsMigration] migration failed', err);
    throw err;
  }
}

export default migrateEnsureIds;
