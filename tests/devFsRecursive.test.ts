import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { devFsService } from '../services/devFsService';

// Reset DB between tests
beforeEach(async () => {
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('DevTycoonDB_v1');
    req.onsuccess = () => resolve();
    req.onerror = () => resolve();
    req.onblocked = () => resolve();
  });
});

describe('devFsService recursive operations', () => {
  it('deletes folder recursively', async () => {
    await devFsService.init();

    await devFsService.createFolder('/a');
    await devFsService.createFolder('/a/b');
    await devFsService.createFile('/a/b/c.txt', 'c');
    await devFsService.createFile('/a/d.txt', 'd');

    // confirm exist
    expect(await devFsService.getEntry('/a')).toBeTruthy();
    expect(await devFsService.getEntry('/a/b/c.txt')).toBeTruthy();

    await devFsService.deleteEntry('/a', true);

    expect(await devFsService.getEntry('/a')).toBeUndefined();
    expect(await devFsService.getEntry('/a/b/c.txt')).toBeUndefined();
    expect(await devFsService.getEntry('/a/d.txt')).toBeUndefined();
  });

  it('renames folder and moves children', async () => {
    await devFsService.init();

    await devFsService.createFolder('/proj');
    await devFsService.createFolder('/proj/sub');
    await devFsService.createFile('/proj/sub/x.txt', 'x');
    await devFsService.createFile('/proj/root.txt', 'root');

    // rename /proj -> /project1
    await devFsService.renameEntry('/proj', '/project1');

    expect(await devFsService.getEntry('/proj')).toBeUndefined();
    const movedFile = await devFsService.getEntry('/project1/sub/x.txt');
    expect(movedFile).toBeTruthy();
    const movedRoot = await devFsService.getEntry('/project1/root.txt');
    expect(movedRoot).toBeTruthy();
  });
});
