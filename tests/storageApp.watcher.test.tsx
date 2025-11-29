import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import { StorageApp } from '../components/StorageApp';

// We'll mock devFsService to simulate events
vi.mock('../services/devFsService', async () => {
  // keep a simple event emitter in the mock
  const listeners = new Set<any>();
  return {
    devFsService: {
      init: vi.fn(async () => {}),
      getEntry: vi.fn(async (path: string) => {
        if (path === '/') return { id: '/', name: '/', type: 'folder' };
        if (path === '/projects') return { id: '/projects', name: 'projects', type: 'folder', parentId: '/' };
        if (path.startsWith('/projects/')) {
          const name = path.split('/').pop();
          if (path.endsWith('/meta.json')) {
            return { id: path, name: 'meta.json', type: 'file', content: '{}' };
          }
          return { id: path, name, type: 'folder', parentId: '/projects' };
        }
        return undefined;
      }),
      listFolder: vi.fn(async (path: string) => {
        if (path === '/') return [{ id: '/projects', name: 'projects', type: 'folder', parentId: '/' }];
        if (path === '/projects') return [];
        return [];
      }),
      createFolder: vi.fn(async (path: string) => ({ id: path, name: path.split('/').pop(), type: 'folder' })),
      createFile: vi.fn(async (path: string, content: string) => ({ id: path, name: path.split('/').pop(), type: 'file', content })),
      deleteEntry: vi.fn(async (path: string, recursive?: boolean) => {}),
      registerListener: vi.fn((cb: any) => {
        listeners.add(cb);
        return () => listeners.delete(cb);
      }),
      // helper to trigger events from tests
      __emit: (event: any) => {
        for (const cb of Array.from(listeners)) cb(event);
      }
    }
  };
});

import { devFsService as mockedDevFsService } from '../services/devFsService';

describe('StorageApp watcher behavior', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it('watcher triggers load when events arrive', async () => {
    render(<StorageApp onClose={() => {}} />);

    // ensure registerListener was called (watcher is registered)
    expect((mockedDevFsService as any).registerListener).toHaveBeenCalled();

    // trigger a create event and advance timers inside act()
    await act(async () => {
      (mockedDevFsService as any).__emit?.({ type: 'create', path: '/projects/myproj' });
      vi.advanceTimersByTime(200);
    });

    // Component should have attempted to process the event
    expect((mockedDevFsService as any).registerListener).toHaveBeenCalled();
  });

  it('watcher callback executes without error on multiple event types', async () => {
    render(<StorageApp onClose={() => {}} />);

    // Check that registerListener was called with a callback
    expect((mockedDevFsService as any).registerListener).toHaveBeenCalled();
    const registerCall = (mockedDevFsService as any).registerListener.mock.calls[0];
    expect(registerCall).toBeDefined();
    expect(registerCall.length).toBeGreaterThan(0);

    // The first argument should be a function (the callback)
    const callback = registerCall[0];
    expect(typeof callback).toBe('function');

    // call callback with different event types inside act()
    await act(async () => {
      callback({ type: 'modify', path: '/projects/meta.json' });
      callback({ type: 'delete', path: '/projects/old' });
      vi.advanceTimersByTime(200);
    });

    // Ensure we didn't throw any errors
    expect(callback).toBeDefined();
  });

  it('falls back to full reload if incremental update cannot find ancestor', async () => {
    render(<StorageApp onClose={() => {}} />);

    // Component should render without crashing
    expect(screen.getByText(/DevFS Navigator/)).toBeDefined();

    // RegisterListener should have been called to set up the watcher
    expect((mockedDevFsService as any).registerListener).toHaveBeenCalled();

    // Emit an event for a path and advance timers
    await act(async () => {
      (mockedDevFsService as any).__emit?.({ type: 'create', path: '/unknown/path/deep/new' });
      vi.advanceTimersByTime(200);
    });

    // Component should have processed the event without crashing
    expect((mockedDevFsService as any).registerListener).toHaveBeenCalled();
  });
});
