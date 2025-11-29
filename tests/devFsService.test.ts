import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { devFsService } from '../services/devFsService';

// Clean DB before each test
beforeEach(async () => {
  // Delete database if exists to ensure isolation
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('DevTycoonDB_v1');
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
});

describe('devFsService (integration with fake-indexeddb)', () => {
  it('initializes root, creates folder and file, lists and reads file', async () => {
    await devFsService.init();

    // Create folder /projects
    const folder = await devFsService.createFolder('/projects');
    expect(folder).toBeTruthy();
    expect(folder.id).toBe('/projects');

    // Create file
    const file = await devFsService.createFile('/projects/hello.txt', 'Hello Test');
    expect(file).toBeTruthy();
    expect(file.id).toBe('/projects/hello.txt');
    expect(file.content).toBe('Hello Test');

    // List folder
    const list = await devFsService.listFolder('/projects');
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(1);

    const read = await devFsService.getEntry('/projects/hello.txt');
    expect(read).toBeTruthy();
    expect((read as any).content).toBe('Hello Test');
  });
});
