// @vitest-environment jsdom
import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import { describe, it, expect, vi } from 'vitest';
import { Desktop } from '../components/Desktop';

// Minimal mock state to render Desktop explorer
const makeMockState = () => ({
  language: 'en',
  userApps: [],
  money: 0,
  inventory: [],
  isShadowMarketUnlocked: false,
  shadowCredits: 0,
  globalHeat: 0,
  hasUnreadMessages: false,
  username: 'test',
  emails: [],
  fileSystem: {
    id: '/',
    name: 'root',
    type: 'folder',
    children: [
      { id: '/foo.txt', name: 'foo.txt', type: 'file', content: 'hello', createdAt: Date.now() }
    ],
    createdAt: Date.now()
  },
  equipped: {
    case: '', monitor: '', keyboard: '', mouse: '', mousepad: '', decor: '', cpu: '', gpu: '', ram: '', storage: '', cooler: '', wall: '', poster: '', desk: '', chair: '', window: '', headphones: '', speakers: ''
  }
}) as any;

describe('FileTree inline rename UI', () => {
  it('has rename button with correct aria-label', async () => {
    const mockOnRename = vi.fn();
    const mockProps: any = {
      state: makeMockState(),
      activeProject: null,
      logs: [],
      chatMessages: [],
      onExit: () => {},
      onBuy: () => {},
      onSell: () => {},
      onCode: () => {},
      onDeploy: () => {},
      onConsoleSubmit: () => {},
      onStartProject: () => {},
      onReleaseProject: () => {},
      onInstallApp: () => {},
      onUninstallApp: () => {},
      onUnlockPerk: () => {},
      onChatSend: () => {},
      onExchange: () => {},
      writtenCode: [],
      isCrunchMode: false,
      onCreateFile: () => {},
      onDeleteFile: () => {},
      onUpdateFile: () => {},
      onRenameFile: mockOnRename,
      storageStats: { totalCapacity: 100, usedBytes: 0, usedGB: 1 },
      onSetLanguage: () => {},
      onStartHack: () => {},
      onPayBill: () => {},
      onTakeLoan: () => {},
      onRepayLoan: () => {},
      onNotify: () => {}
    };

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);

    await act(async () => {
      root.render(React.createElement(Desktop, mockProps));
    });

    // Verify the rename button exists with the correct aria-label for the /foo.txt file
    const renameBtn = container.querySelector('[aria-label="rename-/foo.txt"]') as HTMLElement | null;
    expect(renameBtn).toBeTruthy();
    expect(renameBtn?.textContent).toBe('✏️');

    root.unmount();
    container.remove();
  });
});
