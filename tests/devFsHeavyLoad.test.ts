import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import { devFsService } from '../services/devFsService';
import { dbService } from '../services/dbService';

// Ensure a clean DB for this heavy test
beforeEach(async () => {
    await new Promise<void>((resolve) => {
        const req = indexedDB.deleteDatabase('DevTycoonDB_v1');
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
        req.onblocked = () => resolve();
    });
});

describe('devFsService heavy load', () => {
    it('creates and deletes ~1000 entries and measures time', async () => {
        await dbService.init();
        await devFsService.init();

        // Generate 1000 entries under /heavy/n{i}
        const TOTAL = 1000;
        const root = '/heavy';
        await devFsService.createFolder(root);

        const startCreate = Date.now();
        for (let i = 0; i < TOTAL; i++) {
            const folder = `${root}/dir${Math.floor(i/10)}`; // create some nested folders
            const file = `${folder}/file${i}.txt`;
            // ensure folder
            await devFsService.createFolder(folder);
            await devFsService.createFile(file, `content ${i}`);
        }
        const createTime = Date.now() - startCreate;

        // Verify count roughly
        const all = await dbService.getAll<any>('devFS');
        const heavyCount = all.filter((e:any) => e.id.startsWith(root)).length;
        expect(heavyCount).toBeGreaterThanOrEqual(TOTAL);

        // Measure delete time
        const startDelete = Date.now();
        await devFsService.deleteEntry(root, true);
        const deleteTime = Date.now() - startDelete;

        const after = await dbService.getAll<any>('devFS');
        const remaining = after.filter((e:any) => e.id.startsWith(root)).length;
        expect(remaining).toBe(0);

        // Log timings for developer visibility
        // (Vitest will show console output)
        // We assert that deleteTime completes within a reasonable bound (e.g., 20s)
        console.info('[HeavyLoad 1k] created', TOTAL, 'entries in', createTime, 'ms; deleteTime:', deleteTime, 'ms');
        expect(deleteTime).toBeLessThan(20000);
    }, 60000);

    it('saves and loads ~1000 projects with metadata', async () => {
        await dbService.init();
        await devFsService.init();

        const TOTAL = 1000;
        const projects = [];

        // Create project metadata for 1000 projects
        const startCreate = Date.now();
        for (let i = 0; i < TOTAL; i++) {
            const projectId = `proj_test_1k_${i}`;
            const projectData = {
                id: projectId,
                name: `Test Project ${i}`,
                progress: Math.random() * 100,
                bugs: Math.floor(Math.random() * 50),
                stage: i % 3 === 0 ? 'released' : 'dev',
                baseRevenue: 100 + i * 10,
                linesNeeded: 1000 + i * 100,
                difficulty: Math.floor(Math.random() * 5) + 1,
                type: ['web', 'mobile', 'game', 'ai'][Math.floor(Math.random() * 4)] as any
            };
            await devFsService.saveProject(projectId, projectData);
            projects.push(projectData);
        }
        const createTime = Date.now() - startCreate;

        // Measure load time
        const startLoad = Date.now();
        const loaded = await devFsService.loadAllProjects();
        const loadTime = Date.now() - startLoad;

        // Verify
        expect(loaded.length).toBeGreaterThanOrEqual(TOTAL);
        console.info('[HeavyLoad 1k Projects] saved', TOTAL, 'projects in', createTime, 'ms; loaded in', loadTime, 'ms');
        expect(loadTime).toBeLessThan(15000);
    }, 90000);

    it('saves and loads ~5000 projects with metadata', async () => {
        await dbService.init();
        await devFsService.init();

        const TOTAL = 5000;
        const projects = [];

        // Create project metadata for 5000 projects
        const startCreate = Date.now();
        for (let i = 0; i < TOTAL; i++) {
            const projectId = `proj_test_5k_${i}`;
            const projectData = {
                id: projectId,
                name: `Project ${i}`,
                progress: Math.random() * 100,
                bugs: Math.floor(Math.random() * 50),
                stage: i % 3 === 0 ? 'released' : 'dev',
                baseRevenue: 100 + i * 10,
                linesNeeded: 1000 + i * 100,
                difficulty: Math.floor(Math.random() * 5) + 1,
                type: ['web', 'mobile', 'game', 'ai'][Math.floor(Math.random() * 4)] as any
            };
            await devFsService.saveProject(projectId, projectData);
            projects.push(projectData);
        }
        const createTime = Date.now() - startCreate;

        // Measure load time
        const startLoad = Date.now();
        const loaded = await devFsService.loadAllProjects();
        const loadTime = Date.now() - startLoad;

        // Verify
        expect(loaded.length).toBeGreaterThanOrEqual(TOTAL);
        console.info('[HeavyLoad 5k Projects] saved', TOTAL, 'projects in', createTime, 'ms; loaded in', loadTime, 'ms');
        expect(loadTime).toBeLessThan(30000);
    }, 180000);

    it.skip('saves and loads ~10000 projects with metadata (SKIPPED: слишком тяжёлый для CI, запускать вручную)', async () => {
        await dbService.init();
        await devFsService.init();

        const TOTAL = 10000;
        const projects = [];

        // Create project metadata for 10000 projects
        const startCreate = Date.now();
        for (let i = 0; i < TOTAL; i++) {
            const projectId = `proj_test_10k_${i}`;
            const projectData = {
                id: projectId,
                name: `Project ${i}`,
                progress: Math.random() * 100,
                bugs: Math.floor(Math.random() * 50),
                stage: i % 3 === 0 ? 'released' : 'dev',
                baseRevenue: 100 + i * 10,
                linesNeeded: 1000 + i * 100,
                difficulty: Math.floor(Math.random() * 5) + 1,
                type: ['web', 'mobile', 'game', 'ai'][Math.floor(Math.random() * 4)] as any
            };
            await devFsService.saveProject(projectId, projectData);
            projects.push(projectData);
        }
        const createTime = Date.now() - startCreate;

        // Measure load time
        const startLoad = Date.now();
        const loaded = await devFsService.loadAllProjects();
        const loadTime = Date.now() - startLoad;

        // Verify
        expect(loaded.length).toBeGreaterThanOrEqual(TOTAL);
        console.info('[HeavyLoad 10k Projects] saved', TOTAL, 'projects in', createTime, 'ms; loaded in', loadTime, 'ms');
        expect(loadTime).toBeLessThan(60000);
    }, 300000);

    it('saves and loads 1000 projects with metadata (быстрый тест для CI)', async () => {
        await dbService.init();
        await devFsService.init();

        const TOTAL = 1000;
        const projects = [];

        // Create project metadata for 1000 projects
        const startCreate = Date.now();
        for (let i = 0; i < TOTAL; i++) {
            const projectId = `proj_test_1k_${i}`;
            const projectData = {
                id: projectId,
                name: `Project ${i}`,
                progress: Math.random() * 100,
                bugs: Math.floor(Math.random() * 50),
                stage: i % 3 === 0 ? 'released' : 'dev',
                baseRevenue: 100 + i * 10,
                linesNeeded: 1000 + i * 100,
                difficulty: Math.floor(Math.random() * 5) + 1,
                type: ['web', 'mobile', 'game', 'ai'][Math.floor(Math.random() * 4)] as any
            };
            await devFsService.saveProject(projectId, projectData);
            projects.push(projectData);
        }
        const createTime = Date.now() - startCreate;

        // Measure load time
        const startLoad = Date.now();
        const loaded = await devFsService.loadAllProjects();
        const loadTime = Date.now() - startLoad;

        // Verify
        expect(loaded.length).toBeGreaterThanOrEqual(TOTAL);
        console.info('[HeavyLoad 1k Projects] saved', TOTAL, 'projects in', createTime, 'ms; loaded in', loadTime, 'ms');
        expect(loadTime).toBeLessThan(40000);
    }, 60000);
});
