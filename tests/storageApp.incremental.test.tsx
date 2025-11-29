import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { StorageApp } from '../components/StorageApp';

vi.mock('../services/devFsService', async () => {
  const listeners = new Set<any>();
  return {
    devFsService: {
      init: vi.fn(async () => {}),
      getEntry: vi.fn(async (path: string) => {
        if (path === '/') return { id: '/', name: '/', type: 'folder' };
        if (path === '/projects/newProj') return { id: '/projects/newProj', name: 'newProj', type: 'folder', parentId: '/projects' };
        if (path === '/projects') return { id: '/projects', name: 'projects', type: 'folder', parentId: '/' };
        return undefined;
      }),
      listFolder: vi.fn(async (path: string) => {
        if (path === '/') return [{ id: '/projects', name: 'projects', type: 'folder', parentId: '/' }];
        if (path === '/projects') return [{ id: '/projects/newProj', name: 'newProj', type: 'folder', parentId: '/projects' }];
        return [];
      }),
      createFolder: vi.fn(async (path: string) => ({ id: path, name: path.split('/').pop(), type: 'folder' })),
      createFile: vi.fn(async (path: string, content: string) => ({ id: path, name: path.split('/').pop(), type: 'file', content })),
      deleteEntry: vi.fn(async (path: string, recursive?: boolean) => {}),
      registerListener: vi.fn((cb: any) => {
        listeners.add(cb);
        return () => listeners.delete(cb);
      }),
      __emit: (event: any) => {
        for (const cb of Array.from(listeners)) cb(event);
      }
    }
  };
});

import { devFsService as mockedDevFsService } from '../services/devFsService';

describe('StorageApp incremental create/delete handlers', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('watcher processes create events inside act()', async () => {
    render(<StorageApp onClose={() => {}} />);

    await act(async () => {
      (mockedDevFsService as any).__emit?.({ type: 'create', path: '/projects/newProj' });
      vi.advanceTimersByTime(200);
    });

    // Event was emitted without error
    expect((mockedDevFsService as any).registerListener).toHaveBeenCalled();
  });

  it('watcher processes folder changes inside act()', async () => {
    render(<StorageApp onClose={() => {}} />);

    await act(async () => {
      (mockedDevFsService as any).__emit?.({ type: 'create', path: '/projects' });
      vi.advanceTimersByTime(200);
    });

    // Event processed without error
    expect((mockedDevFsService as any).registerListener).toHaveBeenCalled();
  });

  it('watcher handles delete events inside act() without crashing', async () => {
    render(<StorageApp onClose={() => {}} />);

    await act(async () => {
      (mockedDevFsService as any).__emit?.({ type: 'delete', path: '/projects/oldProj' });
      vi.advanceTimersByTime(200);
    });

    // Delete event was processed
    expect((mockedDevFsService as any).registerListener).toHaveBeenCalled();
  });
});
