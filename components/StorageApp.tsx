import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DevFSEntry, DevFile } from '../types';
import { devFsService, FSWatcherCallback } from '../services/devFsService';

interface StorageAppProps {
    onClose: () => void;
    onNotify?: (title: string, message: string, type?: 'info'|'error'|'success'|'achievement', icon?: string, duration?: number) => void;
    initialPath?: string; // Path to open on start (for Desktop icons)
}

interface TreeNode {
    path: string;
    name: string;
    type: 'file' | 'folder';
    children?: TreeNode[];
    isExpanded?: boolean;
    size?: number;
}

export const StorageApp: React.FC<StorageAppProps> = ({ onClose, onNotify, initialPath }) => {
    const [tree, setTree] = useState<TreeNode | null>(null);
    const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['/']));
    const [selectedPath, setSelectedPath] = useState(initialPath || '/');
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('name');
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState('');
    const [previewContent, setPreviewContent] = useState('');
    const [selectedEntryType, setSelectedEntryType] = useState<'file' | 'folder' | null>(null);
    const [versions, setVersions] = useState<Array<{ id: string; timestamp: number }>>([]);
    const [loadingVersions, setLoadingVersions] = useState(false);
    const [showVersions, setShowVersions] = useState(false);
    const [versionFlags, setVersionFlags] = useState<Record<string, number>>({}); // path -> count
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; path: string; isFolder: boolean } | null>(null);

    // Initialize and load tree
    useEffect(() => {
        loadTree();
    }, []);

    // Expand to initialPath if provided
    useEffect(() => {
        if (initialPath && initialPath !== '/') {
            // Expand all parent folders
            const parts = initialPath.split('/').filter(Boolean);
            const pathsToExpand = new Set<string>(['/']);
            let current = '';
            for (const part of parts) {
                current += '/' + part;
                pathsToExpand.add(current);
            }
            setExpandedPaths(pathsToExpand);
            setSelectedPath(initialPath);
        }
    }, [initialPath, tree]);

    

    const loadTree = async () => {
        setLoading(true);
        try {
            await devFsService.init();
            const root = await devFsService.getEntry('/');
            if (root) {
                const treeNode = await buildTree(root as any, '/');
                setTree(treeNode);
                onNotify?.('✓ Готово', 'Файловая система загружена', 'success', '💾', 2000);

                // Auto-select first file to make the right panel visible immediately
                if (selectedPath === '/') {
                    const findFirstFile = (n: TreeNode | null | undefined): string | null => {
                        if (!n) return null;
                        if (n.type === 'file') return n.path;
                        for (const ch of (n.children || [])) {
                            const p = findFirstFile(ch);
                            if (p) return p;
                        }
                        return null;
                    };
                    const firstFile = findFirstFile(treeNode);
                    if (firstFile) setSelectedPath(firstFile);
                }
            }
        } catch (e) {
            console.error('Failed to load tree', e);
            onNotify?.('⚠ Ошибка', 'Не удалось загрузить файловую систему', 'error', undefined, 3000);
        } finally {
            setLoading(false);
        }
    };

    const buildTree = async (entry: DevFSEntry, path: string): Promise<TreeNode> => {
        const node: TreeNode = {
            path,
            name: entry.name,
            type: entry.type,
        };

        if (entry.type === 'folder') {
            const children = await devFsService.listFolder(path);
            node.children = await Promise.all(
                children.map(child => buildTree(child, `${path === '/' ? '' : path}/${child.name}`))
            );
            // Sort children
            node.children.sort((a, b) => {
                if (sortBy === 'name') {
                    return a.name.localeCompare(b.name);
                }
                return 0;
            });
        } else {
            const entry = await devFsService.getEntry(path);
            if (entry && 'content' in entry) {
                node.size = (entry.content as string).length;
            }
        }

        return node;
    };

    // Debounced, incremental update strategy for DevFS events
    const pendingPathsRef = useRef<Set<string>>(new Set());
    const timerRef = useRef<number | null>(null);

    const normalize = (p: string) => {
        if (!p) return '/';
        let s = p.replace(/\\/g, '/');
        if (!s.startsWith('/')) s = '/' + s;
        s = s.replace(/\/+/g, '/');
        if (s.length > 1 && s.endsWith('/')) s = s.slice(0, -1);
        return s || '/';
    };

    const findAndReplaceNode = useCallback(async (root: TreeNode | null, targetPath: string): Promise<TreeNode | null> => {
        if (!root) return null;

        // if root matches targetPath, rebuild whole root
        if (root.path === targetPath) {
            const entry = await devFsService.getEntry(targetPath);
            if (!entry) return root;
            return await buildTree(entry as any, targetPath);
        }

        if (root.type === 'folder' && root.children) {
            const children = await Promise.all(root.children.map(async (ch) => {
                // If child (or its subtree) contains the targetPath path prefix, recurse
                if (targetPath === ch.path || targetPath.startsWith(ch.path + '/')) {
                    return await findAndReplaceNode(ch, targetPath) as TreeNode;
                }
                return ch;
            }));

            return { ...root, children };
        }

        return root;
    }, [buildTree]);

    const processPending = useCallback(async () => {
    const pending = Array.from(pendingPathsRef.current) as string[];
        pendingPathsRef.current.clear();
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }

        if (!tree) {
            await loadTree();
            return;
        }

        // Try to incrementally update affected subtrees; if anything unexpected, fall back to full reload
        try {
            let newRoot: TreeNode | null = tree;
            for (const rawPath of pending) {
                const p = normalize(String(rawPath));
                // If path is root or top-level change, reload entirely
                if (p === '/' || p === tree.path) {
                    await loadTree();
                    return;
                }

                // Find nearest existing ancestor in current tree
                let ancestor = p;
                let found = false;
                while (ancestor !== '/') {
                    // try to find a node with this path in the existing tree
                    const nodeExists = (node: TreeNode | undefined): boolean => {
                        if (!node) return false;
                        if (node.path === ancestor) return true;
                        if (node.type === 'folder' && node.children) {
                            return node.children.some(c => nodeExists(c));
                        }
                        return false;
                    };

                    if (nodeExists(newRoot || undefined)) { found = true; break; }
                    // step up
                    ancestor = ancestor.split('/').slice(0, -1).join('/') || '/';
                }

                if (!found) {
                    // can't find a place to patch safely; full reload
                    await loadTree();
                    return;
                }

                // Rebuild subtree at the nearest ancestor
                newRoot = await findAndReplaceNode(newRoot, ancestor);
            }

            if (newRoot) setTree(newRoot);
        } catch (e) {
            console.warn('[StorageApp] incremental update failed, falling back to full reload', e);
            await loadTree();
        }
    }, [tree, buildTree, findAndReplaceNode]);

    // Collect visible file paths under expanded folders
    const collectVisibleFiles = useCallback((node: TreeNode | null | undefined, acc: string[] = []): string[] => {
        if (!node) return acc;
        if (node.type === 'file') {
            acc.push(node.path);
            return acc;
        }
        // only traverse children of expanded folders
        if (expandedPaths.has(node.path)) {
            (node.children || []).forEach(ch => collectVisibleFiles(ch, acc));
        }
        return acc;
    }, [expandedPaths]);

    // Load version counts lazily for visible files
    useEffect(() => {
        if (!tree) return;
        const visibleFiles = collectVisibleFiles(tree);
        const missing = visibleFiles.filter(p => versionFlags[p] === undefined);
        if (missing.length === 0) return;
        let cancelled = false;
        (async () => {
            const updates: Record<string, number> = {};
            for (const p of missing) {
                try {
                    const list = await (devFsService as any).getVersions(p, 1);
                    updates[p] = Array.isArray(list) ? list.length : 0;
                } catch {
                    updates[p] = 0;
                }
            }
            if (!cancelled) setVersionFlags(prev => ({ ...prev, ...updates }));
        })();
        return () => { cancelled = true; };
    }, [tree, expandedPaths]);

    useEffect(() => {
        const callback: FSWatcherCallback = (event) => {
            try {
                const p = normalize(event.path);
                pendingPathsRef.current.add(p);
                if (timerRef.current) {
                    clearTimeout(timerRef.current);
                }
                // debounce updates to batch multiple events
                timerRef.current = window.setTimeout(() => {
                    void processPending();
                }, 150);
            } catch (e) {
                console.warn('[StorageApp] watcher callback failed', e);
            }
        };

        const unsubscribe = devFsService.registerListener(callback);
        return () => {
            try { unsubscribe(); } catch (e) { /* ignore */ }
            if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
        };
    }, [processPending]);

    const toggleExpand = (path: string) => {
        const newExpanded = new Set(expandedPaths);
        if (newExpanded.has(path)) {
            newExpanded.delete(path);
        } else {
            newExpanded.add(path);
        }
        setExpandedPaths(newExpanded);
    };

    const handleCreateFolder = async () => {
        const name = prompt('Имя новой папки:');
        if (!name) return;

        try {
            const newPath = `${selectedPath === '/' ? '' : selectedPath}/${name}`;
            await devFsService.createFolder(newPath);
            onNotify?.('✓ Создано', `Папка "${name}" создана`, 'success', '📁', 2000);
            // Patch: only reload the parent folder (selectedPath) instead of full tree
            try {
                const updated = await findAndReplaceNode(tree, selectedPath);
                if (updated) setTree(updated);
            } catch (patchErr) {
                // Fallback to full reload if patching fails
                await loadTree();
            }
        } catch (e) {
            onNotify?.('⚠ Ошибка', `Не удалось создать папку: ${e}`, 'error');
        }
    };

    const handleDeleteEntry = async (path: string, isFolder: boolean) => {
        if (!confirm(`Точно удалить ${isFolder ? 'папку' : 'файл'} "${path}"?`)) return;

        try {
            const parentPath = path.split('/').slice(0, -1).join('/') || '/';
            await devFsService.deleteEntry(path, true);
            onNotify?.('✓ Удалено', `"${path}" удалено`, 'success', '🗑️', 2000);
            setSelectedPath('/');
            // Patch: only reload the parent folder instead of full tree
            try {
                const updated = await findAndReplaceNode(tree, parentPath);
                if (updated) setTree(updated);
            } catch (patchErr) {
                // Fallback to full reload if patching fails
                await loadTree();
            }
        } catch (e) {
            onNotify?.('⚠ Ошибка', `Не удалось удалить: ${e}`, 'error');
        }
    };

    const handleCreateFile = async () => {
        const name = prompt('Имя нового файла:');
        if (!name) return;

        try {
            const newPath = `${selectedPath === '/' ? '' : selectedPath}/${name}`;
            await devFsService.createFile(newPath, '');
            onNotify?.('✓ Создано', `Файл "${name}" создан`, 'success', '📄', 2000);
            // Patch: only reload the parent folder (selectedPath) instead of full tree
            try {
                const updated = await findAndReplaceNode(tree, selectedPath);
                if (updated) setTree(updated);
            } catch (patchErr) {
                // Fallback to full reload if patching fails
                await loadTree();
            }
        } catch (e) {
            onNotify?.('⚠ Ошибка', `Не удалось создать файл: ${e}`, 'error');
        }
    };

    const handleRenameEntry = async (oldPath: string, newName: string) => {
        if (!newName.trim()) return;

        try {
            const parentPath = oldPath.split('/').slice(0, -1).join('/') || '/';
            const newPath = `${parentPath === '/' ? '' : parentPath}/${newName.trim()}`;

            await devFsService.renameEntry(oldPath, newPath);
            onNotify?.('✓ Переименовано', `"${oldPath}" → "${newPath}"`, 'success', '✏️', 2000);
            setSelectedPath(newPath);
            setIsRenaming(false);
            // Reload tree after rename
            await loadTree();
        } catch (e) {
            onNotify?.('⚠ Ошибка', `Не удалось переименовать: ${e}`, 'error');
        }
    };

    const handleCopyEntry = async (path: string) => {
        const name = prompt('Имя копии:');
        if (!name) return;

        try {
            const entry = await devFsService.getEntry(path);
            if (!entry) throw new Error('Entry not found');

            const parentPath = path.split('/').slice(0, -1).join('/') || '/';
            const newPath = `${parentPath === '/' ? '' : parentPath}/${name}`;

            if (entry.type === 'file') {
                const content = (entry as DevFile).content || '';
                await devFsService.createFile(newPath, content);
            } else {
                // For folders, we need to recursively copy
                await copyFolderRecursive(path, newPath);
            }

            onNotify?.('✓ Скопировано', `"${path}" → "${newPath}"`, 'success', '📋', 2000);
            await loadTree();
        } catch (e) {
            onNotify?.('⚠ Ошибка', `Не удалось скопировать: ${e}`, 'error');
        }
    };

    const copyFolderRecursive = async (srcPath: string, destPath: string) => {
        await devFsService.createFolder(destPath);
        const children = await devFsService.listFolder(srcPath);

        for (const child of children) {
            const childSrcPath = `${srcPath}/${child.name}`;
            const childDestPath = `${destPath}/${child.name}`;

            if (child.type === 'file') {
                const content = (child as DevFile).content || '';
                await devFsService.createFile(childDestPath, content);
            } else {
                await copyFolderRecursive(childSrcPath, childDestPath);
            }
        }
    };

    const handleMoveEntry = async (oldPath: string, newParentPath: string) => {
        const entry = await devFsService.getEntry(oldPath);
        if (!entry) return;

        const newPath = `${newParentPath === '/' ? '' : newParentPath}/${entry.name}`;

        try {
            await devFsService.renameEntry(oldPath, newPath);
            onNotify?.('✓ Перемещено', `"${oldPath}" → "${newPath}"`, 'success', '📦', 2000);
            setSelectedPath(newPath);
            await loadTree();
        } catch (e) {
            onNotify?.('⚠ Ошибка', `Не удалось переместить: ${e}`, 'error');
        }
    };

    const loadPreview = async (path: string) => {
        try {
            const entry = await devFsService.getEntry(path);
            if (entry && entry.type === 'file') {
                const content = (entry as DevFile).content || '';
                setPreviewContent(content.length > 1000 ? content.substring(0, 1000) + '...' : content);
                setSelectedEntryType('file');
            } else {
                setPreviewContent('');
                setSelectedEntryType(entry ? 'folder' : null);
            }
        } catch (e) {
            setPreviewContent('Ошибка загрузки превью');
            setSelectedEntryType(null);
        }
    };

    // Load preview and reset versions when selection changes
    useEffect(() => {
        if (selectedPath) {
            void loadPreview(selectedPath);
            setShowVersions(false);
            setVersions([]);
        }
    }, [selectedPath]);

    const loadVersionsForSelected = async () => {
        if (!selectedPath || selectedEntryType !== 'file') return;
        setLoadingVersions(true);
        try {
            const list = await (devFsService as any).getVersions(selectedPath, 25);
            setVersions(list.map((v: any) => ({ id: v.id, timestamp: v.timestamp })));
            setShowVersions(true);
        } catch (e) {
            console.warn('[StorageApp] loadVersions failed', e);
            onNotify?.('⚠ Ошибка', `Не удалось загрузить версии: ${e}`, 'error');
        } finally {
            setLoadingVersions(false);
        }
    };

    const restoreVersionForSelected = async (verId: string) => {
        try {
            await (devFsService as any).restoreVersion(selectedPath, verId);
            onNotify?.('↩ Откат выполнен', `Восстановлена версия файла`, 'success', '🕓', 2000);
            await loadPreview(selectedPath);
            // refresh tree node to get updated size
            try {
                const updated = await findAndReplaceNode(tree, selectedPath.split('/').slice(0, -1).join('/') || '/');
                if (updated) setTree(updated);
            } catch { await loadTree(); }
        } catch (e) {
            onNotify?.('⚠ Ошибка', `Не удалось откатить версию: ${e}`, 'error');
        }
    };

    const formatSize = (bytes: number | undefined): string => {
        if (!bytes) return '—';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const renderTreeNode = (node: TreeNode | undefined, level: number = 0): React.ReactNode => {
        if (!node) return null;

        const isExpanded = expandedPaths.has(node.path);
        const hasChildren = node.type === 'folder' && node.children && node.children.length > 0;
        const isSelected = selectedPath === node.path;
        const verCount = node.type === 'file' ? (versionFlags[node.path] || 0) : 0;
        const isRenamingThis = isRenaming && isSelected;

        const handleContextMenu = (e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setContextMenu({
                x: e.clientX,
                y: e.clientY,
                path: node.path,
                isFolder: node.type === 'folder'
            });
        };

        return (
            <div key={node.path}>
                <div
                    className={`flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-slate-600 rounded ${
                        isSelected ? 'bg-slate-500' : ''
                    }`}
                    style={{ marginLeft: `${level * 16}px` }}
                    onClick={() => setSelectedPath(node.path)}
                    onContextMenu={handleContextMenu}
                    onDoubleClick={() => {
                        if (node.type === 'folder') {
                            toggleExpand(node.path);
                        }
                    }}
                >
                    {hasChildren && (
                        <button
                            className="w-4 text-center text-xs"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleExpand(node.path);
                            }}
                        >
                            {isExpanded ? '▼' : '▶'}
                        </button>
                    )}
                    {!hasChildren && node.type === 'folder' && <span className="w-4" />}

                    <span className="text-lg">
                        {node.type === 'folder' ? '📁' : getFileIcon(node.name)}
                    </span>
                    
                    {isRenamingThis ? (
                        <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleRenameEntry(node.path, renameValue);
                                } else if (e.key === 'Escape') {
                                    setIsRenaming(false);
                                }
                            }}
                            onBlur={() => setIsRenaming(false)}
                            autoFocus
                            className="flex-1 bg-slate-700 text-white text-sm px-1 rounded border border-blue-500 outline-none"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className="text-sm text-slate-200 flex-1 truncate flex items-center gap-2">
                            {node.name}
                            {node.type === 'file' && verCount > 0 && (
                                <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-900/50 border border-blue-700 text-blue-200" title="Есть версии файла">
                                    🕓 {verCount}
                                </span>
                            )}
                        </span>
                    )}
                    {node.type === 'file' && <span className="text-xs text-slate-400">{formatSize(node.size)}</span>}

                    {isSelected && !isRenamingThis && (
                        <div className="flex gap-1">
                            <button
                                className="text-blue-400 hover:text-blue-300 text-xs px-1"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setRenameValue(node.name);
                                    setIsRenaming(true);
                                }}
                                title="Переименовать"
                            >
                                ✏️
                            </button>
                            <button
                                className="text-green-400 hover:text-green-300 text-xs px-1"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyEntry(node.path);
                                }}
                                title="Копировать"
                            >
                                📋
                            </button>
                            <button
                                className="text-red-400 hover:text-red-300 text-xs px-1"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteEntry(node.path, node.type === 'folder');
                                }}
                                title="Удалить"
                            >
                                🗑️
                            </button>
                        </div>
                    )}
                </div>

                {hasChildren && isExpanded && (
                    <div>
                        {node.children!.map(child => renderTreeNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    const getFileIcon = (name: string): string => {
        const ext = name.split('.').pop()?.toLowerCase();
        switch (ext) {
            case 'html': return '🌐';
            case 'css': return '🎨';
            case 'js': case 'ts': case 'tsx': case 'jsx': return '⚡';
            case 'json': return '📋';
            case 'md': return '📝';
            case 'png': case 'jpg': case 'gif': case 'svg': return '🖼️';
            case 'mp3': case 'wav': case 'ogg': return '🎵';
            default: return '📄';
        }
    };

    const getTotalSize = (node: TreeNode | null | undefined): number => {
        if (!node) return 0;
        if (node.type === 'file') return node.size || 0;
        return (node.children || []).reduce((sum, child) => sum + getTotalSize(child), 0);
    };

    const getFileCount = (node: TreeNode | null | undefined): number => {
        if (!node) return 0;
        if (node.type === 'file') return 1;
        return (node.children || []).reduce((sum, child) => sum + getFileCount(child), 0);
    };

    const findNode = (root: TreeNode, path: string): TreeNode | null => {
        if (root.path === path) return root;
        if (root.type === 'folder' && root.children) {
            for (const child of root.children) {
                const found = findNode(child, path);
                if (found) return found;
            }
        }
        return null;
    };

    const filterTree = (node: TreeNode | null | undefined, query: string): TreeNode | null => {
        if (!node) return null;
        if (!query) return node;

        const matches = node.name.toLowerCase().includes(query.toLowerCase());

        if (node.type === 'file') {
            return matches ? node : null;
        }

        const filteredChildren = (node.children || [])
            .map(child => filterTree(child, query))
            .filter(Boolean) as TreeNode[];

        if (matches || filteredChildren.length > 0) {
            return { ...node, children: filteredChildren };
        }

        return null;
    };

    const sortTree = (node: TreeNode | null | undefined): TreeNode | null => {
        if (!node || node.type === 'file') return node as TreeNode | null;

        const sortedChildren = [...(node.children || [])].sort((a, b) => {
            if (sortBy === 'name') {
                return a.name.localeCompare(b.name);
            } else if (sortBy === 'size') {
                const aSize = getTotalSize(a);
                const bSize = getTotalSize(b);
                return bSize - aSize; // Descending
            } else if (sortBy === 'date') {
                // For now, sort by name as date is not stored
                return a.name.localeCompare(b.name);
            }
            return 0;
        });

        return {
            ...node,
            children: sortedChildren.map(sortTree).filter(Boolean) as TreeNode[]
        };
    };

    const filteredTree = filterTree(tree, searchQuery);
    const sortedFilteredTree = sortTree(filteredTree);

    // Close context menu on click outside
    useEffect(() => {
        const handleClick = () => setContextMenu(null);
        if (contextMenu) {
            window.addEventListener('click', handleClick);
            return () => window.removeEventListener('click', handleClick);
        }
    }, [contextMenu]);

    return (
        <div className="absolute top-10 left-10 right-10 bottom-10 bg-slate-900 rounded-lg shadow-2xl flex overflow-hidden border border-slate-700 animate-in fade-in zoom-in duration-300 font-sans flex-col">
            {/* Context Menu */}
            {contextMenu && (
                <div
                    className="fixed bg-slate-800 border border-slate-600 rounded shadow-xl z-[9999] py-1 min-w-[160px]"
                    style={{ left: contextMenu.x, top: contextMenu.y }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        className="w-full px-3 py-1.5 text-left text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-2"
                        onClick={() => {
                            const entry = tree ? findNode(tree, contextMenu.path) : null;
                            if (entry) {
                                setRenameValue(entry.name);
                                setSelectedPath(contextMenu.path);
                                setIsRenaming(true);
                            }
                            setContextMenu(null);
                        }}
                    >
                        ✏️ Переименовать
                    </button>
                    <button
                        className="w-full px-3 py-1.5 text-left text-sm text-slate-200 hover:bg-slate-700 flex items-center gap-2"
                        onClick={() => {
                            handleCopyEntry(contextMenu.path);
                            setContextMenu(null);
                        }}
                    >
                        📋 Копировать
                    </button>
                    <div className="border-t border-slate-700 my-1" />
                    <button
                        className="w-full px-3 py-1.5 text-left text-sm text-red-400 hover:bg-slate-700 flex items-center gap-2"
                        onClick={() => {
                            handleDeleteEntry(contextMenu.path, contextMenu.isFolder);
                            setContextMenu(null);
                        }}
                    >
                        🗑️ Удалить
                    </button>
                </div>
            )}
            {/* Header */}
            <div className="bg-slate-800 border-b border-slate-700 p-4 flex justify-between items-center">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                    💾 StorageApp — DevFS Navigator
                </h1>
                <button onClick={onClose} className="text-slate-500 hover:text-white text-2xl">
                    ✕
                </button>
            </div>

            {/* Toolbar */}
            <div className="bg-slate-800 border-b border-slate-700 p-3 flex gap-2 flex-wrap">
                <button
                    onClick={handleCreateFolder}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-sm font-bold transition-colors"
                    disabled={loading}
                >
                    + Папка
                </button>
                <button
                    onClick={handleCreateFile}
                    className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white rounded text-sm font-bold transition-colors"
                    disabled={loading}
                >
                    + Файл
                </button>
                <button
                    onClick={loadTree}
                    className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors"
                    disabled={loading}
                >
                    🔄 Обновить
                </button>

                <div className="flex-1" />

                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="px-2 py-1 bg-slate-700 text-white rounded text-sm border border-slate-600"
                >
                    <option value="name">По имени</option>
                    <option value="date">По дате</option>
                    <option value="size">По размеру</option>
                </select>

                <input
                    type="text"
                    placeholder="Поиск..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-2 py-1 bg-slate-700 text-white rounded text-sm border border-slate-600 w-32"
                />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto bg-slate-900 p-4">
                {loading ? (
                    <div className="text-slate-400 text-center py-8">
                        Загрузка файловой системы...
                    </div>
                ) : sortedFilteredTree ? (
                    <div className="flex flex-1 overflow-hidden">
                        <div className="flex-1 font-mono text-sm text-slate-300 overflow-y-auto">
                            {renderTreeNode(sortedFilteredTree)}
                        </div>
                        {selectedPath !== '/' && (
                            <div className="w-80 border-l border-slate-700 bg-slate-800 p-4 overflow-y-auto">
                                <h3 className="text-sm font-bold text-slate-200 mb-2">Превью</h3>
                                <pre className="text-xs text-slate-300 bg-slate-900 p-2 rounded whitespace-pre-wrap break-words">
                                    {previewContent || 'Выберите файл для просмотра'}
                                </pre>
                                {selectedEntryType === 'file' ? (
                                    <div className="mt-4">
                                        <button
                                            onClick={loadVersionsForSelected}
                                            disabled={loadingVersions}
                                            className="px-2 py-1 bg-blue-700 hover:bg-blue-600 text-white rounded text-xs border border-blue-600 font-bold"
                                        >
                                            🕓 История версий
                                        </button>
                                        {showVersions && (
                                            <div className="mt-2 space-y-1 max-h-48 overflow-auto">
                                                {versions.length === 0 ? (
                                                    <div className="text-xs text-slate-400">Версий не найдено</div>
                                                ) : (
                                                    versions.map(v => (
                                                        <div key={v.id} className="flex items-center justify-between text-xs text-slate-300 bg-slate-900 p-2 rounded border border-slate-700">
                                                            <span>{new Date(v.timestamp).toLocaleString()}</span>
                                                            <button
                                                                className="px-2 py-0.5 bg-blue-700 hover:bg-blue-600 text-white rounded"
                                                                onClick={() => restoreVersionForSelected(v.id)}
                                                            >
                                                                Откатить
                                                            </button>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="mt-4">
                                        <button
                                            disabled
                                            title="История версий доступна только для файлов"
                                            className="px-2 py-1 bg-slate-700 text-slate-400 rounded text-xs border border-slate-600 cursor-not-allowed"
                                        >
                                            🕓 История версий
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-slate-400 text-center py-8">
                        Файловая система не инициализирована
                    </div>
                )}
            </div>

            {/* Footer Stats */}
            <div className="bg-slate-800 border-t border-slate-700 p-3 flex justify-between text-xs text-slate-400">
                <div>
                    📊 Файлов: <span className="text-slate-200">{getFileCount(tree)}</span>
                </div>
                <div>
                    💾 Использовано: <span className="text-slate-200">{formatSize(getTotalSize(tree))}</span>
                </div>
                <div>
                    📂 Текущая папка: <span className="text-slate-200 font-mono">{selectedPath}</span>
                </div>
            </div>

            {/* Always-visible helper panel at the very bottom to guide users */}
            {(!sortedFilteredTree || selectedEntryType !== 'file') && (
                <div className="bg-blue-900/40 border-t border-blue-700 text-blue-200 text-xs px-3 py-2">
                    Подсказка: выберите файл слева, чтобы увидеть превью и историю версий. Версии появляются при перезаписи файла с изменённым содержимым (например, сохранение из VisualEditor).
                </div>
            )}
        </div>
    );
};
