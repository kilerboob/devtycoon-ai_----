import React, { useState, useEffect, useRef, useCallback } from 'react';
import { playSound } from '../utils/sound';

interface AdvancedFurnitureEditorProps {
  roomId: number;
  onClose: () => void;
  money?: number;
  onSpendMoney?: (amount: number) => void;
  onItemsChanged?: (items: FurnitureItem[]) => void;
}

interface FurnitureType {
  type: string;
  emoji: string;
  price: number;
  category: string;
  dimensions: { width: number; height: number; depth: number };
  stackable: boolean;
  wallMount: boolean;
}

interface FurnitureItem {
  id?: number;
  item_type: string;
  position: { x: number; y: number; z: number };
  rotation: number;
  scale: number;
  locked?: boolean;
  groupId?: string;
  metadata?: any;
}

type EditMode = 'move' | 'rotate' | 'scale' | 'select';
type ViewMode = 'perspective' | 'top' | 'front' | 'side';

interface HistoryState {
  items: FurnitureItem[];
  timestamp: number;
}

const FURNITURE_CATALOG: FurnitureType[] = [
  // Сидения
  { type: 'office_chair', emoji: '🪑', price: 350, category: 'seating', dimensions: { width: 1, height: 2, depth: 1 }, stackable: false, wallMount: false },
  { type: 'gaming_chair', emoji: '💺', price: 800, category: 'seating', dimensions: { width: 1.2, height: 2.2, depth: 1.2 }, stackable: false, wallMount: false },
  { type: 'sofa', emoji: '🛋️', price: 1200, category: 'seating', dimensions: { width: 3, height: 1.5, depth: 1.5 }, stackable: false, wallMount: false },
  { type: 'bean_bag', emoji: '⚫', price: 180, category: 'seating', dimensions: { width: 1.5, height: 0.8, depth: 1.5 }, stackable: false, wallMount: false },
  
  // Столы
  { type: 'desk', emoji: '🖥️', price: 600, category: 'tables', dimensions: { width: 2, height: 1.5, depth: 1 }, stackable: false, wallMount: false },
  { type: 'gaming_desk', emoji: '🎮', price: 1500, category: 'tables', dimensions: { width: 2.5, height: 1.5, depth: 1.2 }, stackable: false, wallMount: false },
  { type: 'standing_desk', emoji: '⬆️', price: 2000, category: 'tables', dimensions: { width: 2, height: 2, depth: 1 }, stackable: false, wallMount: false },
  { type: 'coffee_table', emoji: '☕', price: 400, category: 'tables', dimensions: { width: 1.5, height: 0.8, depth: 1 }, stackable: false, wallMount: false },
  
  // Хранение
  { type: 'bookshelf', emoji: '📚', price: 500, category: 'storage', dimensions: { width: 1.5, height: 3, depth: 0.5 }, stackable: false, wallMount: false },
  { type: 'cabinet', emoji: '🗄️', price: 700, category: 'storage', dimensions: { width: 1.5, height: 2, depth: 0.8 }, stackable: false, wallMount: false },
  { type: 'server_rack', emoji: '🖥️', price: 5000, category: 'storage', dimensions: { width: 1, height: 3, depth: 1 }, stackable: false, wallMount: false },
  
  // Электроника
  { type: 'monitor', emoji: '🖥️', price: 800, category: 'electronics', dimensions: { width: 0.8, height: 0.6, depth: 0.3 }, stackable: true, wallMount: true },
  { type: 'dual_monitor', emoji: '🖥️🖥️', price: 1600, category: 'electronics', dimensions: { width: 1.6, height: 0.6, depth: 0.3 }, stackable: true, wallMount: false },
  { type: 'tv_65', emoji: '📺', price: 2500, category: 'electronics', dimensions: { width: 2, height: 1.5, depth: 0.2 }, stackable: false, wallMount: true },
  { type: 'speakers', emoji: '🔊', price: 450, category: 'electronics', dimensions: { width: 0.5, height: 0.8, depth: 0.5 }, stackable: true, wallMount: false },
  
  // Освещение
  { type: 'desk_lamp', emoji: '💡', price: 120, category: 'lighting', dimensions: { width: 0.3, height: 0.8, depth: 0.3 }, stackable: true, wallMount: false },
  { type: 'rgb_strip', emoji: '🌈', price: 200, category: 'lighting', dimensions: { width: 5, height: 0.1, depth: 0.1 }, stackable: false, wallMount: true },
  { type: 'neon_sign', emoji: '🔴', price: 350, category: 'lighting', dimensions: { width: 1.5, height: 0.8, depth: 0.2 }, stackable: false, wallMount: true },
  
  // Декор
  { type: 'plant_small', emoji: '🪴', price: 80, category: 'decor', dimensions: { width: 0.4, height: 0.6, depth: 0.4 }, stackable: true, wallMount: false },
  { type: 'plant_large', emoji: '🌴', price: 250, category: 'decor', dimensions: { width: 0.8, height: 2.5, depth: 0.8 }, stackable: false, wallMount: false },
  { type: 'poster', emoji: '🖼️', price: 100, category: 'decor', dimensions: { width: 1, height: 1.5, depth: 0.05 }, stackable: false, wallMount: true },
  { type: 'clock', emoji: '🕒', price: 150, category: 'decor', dimensions: { width: 0.6, height: 0.6, depth: 0.1 }, stackable: false, wallMount: true },
  { type: 'rug', emoji: '🟥', price: 300, category: 'decor', dimensions: { width: 3, height: 0.05, depth: 2 }, stackable: false, wallMount: false },
  
  // Специальное оборудование
  { type: 'pc_case', emoji: '🖳', price: 1500, category: 'equipment', dimensions: { width: 0.5, height: 1, depth: 0.6 }, stackable: false, wallMount: false },
  { type: '3d_printer', emoji: '🖨️', price: 3000, category: 'equipment', dimensions: { width: 0.8, height: 1, depth: 0.8 }, stackable: false, wallMount: false },
  { type: 'whiteboard', emoji: '⬜', price: 400, category: 'equipment', dimensions: { width: 2, height: 1.5, depth: 0.1 }, stackable: false, wallMount: true },
];

const ROOM_TEMPLATES = {
  streamer: [
    { type: 'gaming_desk', position: { x: 5, y: 0, z: 5 }, rotation: 0, scale: 1 },
    { type: 'gaming_chair', position: { x: 5, y: 0, z: 3.5 }, rotation: 0, scale: 1 },
    { type: 'dual_monitor', position: { x: 5, y: 1.5, z: 5.5 }, rotation: 0, scale: 1 },
    { type: 'rgb_strip', position: { x: 5, y: 2.5, z: 7 }, rotation: 0, scale: 1 },
    { type: 'speakers', position: { x: 3.5, y: 1.5, z: 5 }, rotation: 0, scale: 1 },
  ],
  developer: [
    { type: 'standing_desk', position: { x: 5, y: 0, z: 5 }, rotation: 0, scale: 1 },
    { type: 'office_chair', position: { x: 5, y: 0, z: 3.5 }, rotation: 0, scale: 1 },
    { type: 'dual_monitor', position: { x: 5, y: 2, z: 5.5 }, rotation: 0, scale: 1 },
    { type: 'bookshelf', position: { x: 2, y: 0, z: 7 }, rotation: 90, scale: 1 },
    { type: 'plant_large', position: { x: 8, y: 0, z: 7 }, rotation: 0, scale: 1 },
    { type: 'whiteboard', position: { x: 8, y: 1.5, z: 9 }, rotation: 180, scale: 1 },
  ],
  minimal: [
    { type: 'desk', position: { x: 5, y: 0, z: 5 }, rotation: 0, scale: 1 },
    { type: 'office_chair', position: { x: 5, y: 0, z: 3.5 }, rotation: 0, scale: 1 },
    { type: 'monitor', position: { x: 5, y: 1.5, z: 5.5 }, rotation: 0, scale: 1 },
    { type: 'desk_lamp', position: { x: 6, y: 1.5, z: 5 }, rotation: 0, scale: 1 },
  ],
};

export default function AdvancedFurnitureEditor({
  roomId,
  onClose,
  money = 5000,
  onSpendMoney,
  onItemsChanged,
}: AdvancedFurnitureEditorProps) {
  const [items, setItems] = useState<FurnitureItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [editMode, setEditMode] = useState<EditMode>('select');
  const [viewMode, setViewMode] = useState<ViewMode>('perspective');
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(0.5);
  const [showGrid, setShowGrid] = useState(true);
  const [currentLayer, setCurrentLayer] = useState(0);
  const [clipboard, setClipboard] = useState<FurnitureItem[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCollisions, setShowCollisions] = useState(true);
  const devUnlimited = (typeof window !== 'undefined') && localStorage.getItem('dev-unlimited-money') === '1';
  const effectiveMoney = devUnlimited ? Number.MAX_SAFE_INTEGER : money;
  
  // История изменений (Undo/Redo)
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  const bcRef = useRef<BroadcastChannel | null>(null);

  // Загрузка существующей мебели
  useEffect(() => {
    bcRef.current = new BroadcastChannel('room-items');
    bcRef.current.onmessage = (e: MessageEvent) => {
      const data = e.data || {};
      if (data.roomId === roomId && data.source !== 'advanced-3d' && Array.isArray(data.items)) {
        setItems(data.items);
        onItemsChanged?.(data.items);
      }
    };

    fetch(`http://localhost:3000/api/rooms/${roomId}/items`)
      .then(res => res.json())
      .then(data => {
        setItems(data);
        addToHistory(data);
      })
      .catch(console.error);

    return () => bcRef.current?.close();
  }, [roomId]);

  // Добавление в историю
  const addToHistory = useCallback((newItems: FurnitureItem[]) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push({ items: JSON.parse(JSON.stringify(newItems)), timestamp: Date.now() });
      // Ограничиваем историю 50 шагами
      if (newHistory.length > 50) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  // Отмена действия (Undo)
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const state = history[newIndex];
      setItems(JSON.parse(JSON.stringify(state.items)));
      broadcastItems(state.items);
      playSound?.('click');
      showSuccess('Действие отменено');
    }
  }, [historyIndex, history]);

  // Повтор действия (Redo)
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      const state = history[newIndex];
      setItems(JSON.parse(JSON.stringify(state.items)));
      broadcastItems(state.items);
      playSound?.('click');
      showSuccess('Действие повторено');
    }
  }, [historyIndex, history]);

  // Broadcast helper
  const broadcastItems = (newItems: FurnitureItem[]) => {
    try {
      bcRef.current?.postMessage({ roomId, items: newItems, source: 'advanced-3d' });
    } catch {}
  };

  // Показать ошибку
  const showError = (msg: string) => {
    setErrorMsg(msg);
    playSound?.('error');
    setTimeout(() => setErrorMsg(null), 3000);
  };

  // Показать успех
  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    playSound?.('success');
    setTimeout(() => setSuccessMsg(null), 2000);
  };

  // Привязка к сетке
  const snapValue = useCallback((value: number) => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  }, [snapToGrid, gridSize]);

  // Проверка коллизий
  const checkCollision = useCallback((item1: FurnitureItem, item2: FurnitureItem): boolean => {
    const furniture1 = FURNITURE_CATALOG.find(f => f.type === item1.item_type);
    const furniture2 = FURNITURE_CATALOG.find(f => f.type === item2.item_type);
    if (!furniture1 || !furniture2) return false;

    const dims1 = {
      width: furniture1.dimensions.width * item1.scale,
      height: furniture1.dimensions.height * item1.scale,
      depth: furniture1.dimensions.depth * item1.scale,
    };
    const dims2 = {
      width: furniture2.dimensions.width * item2.scale,
      height: furniture2.dimensions.height * item2.scale,
      depth: furniture2.dimensions.depth * item2.scale,
    };

    return (
      Math.abs(item1.position.x - item2.position.x) < (dims1.width + dims2.width) / 2 &&
      Math.abs(item1.position.y - item2.position.y) < (dims1.height + dims2.height) / 2 &&
      Math.abs(item1.position.z - item2.position.z) < (dims1.depth + dims2.depth) / 2
    );
  }, []);

  // Проверка всех коллизий для объекта
  const hasCollisions = useCallback((item: FurnitureItem): boolean => {
    return items.some(other => other.id !== item.id && checkCollision(item, other));
  }, [items, checkCollision]);

  // Добавить мебель
  const handleAddFurniture = async (furnitureType: FurnitureType) => {
    if (effectiveMoney < furnitureType.price) {
      showError(`Недостаточно средств! Нужно $${furnitureType.price}, есть $${money}`);
      return;
    }

    const newItem: FurnitureItem = {
      item_type: furnitureType.type,
      position: { 
        x: snapValue(5), 
        y: currentLayer, 
        z: snapValue(5) 
      },
      rotation: 0,
      scale: 1,
      locked: false,
    };

    try {
      const response = await fetch(`http://localhost:3000/api/rooms/${roomId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });

      if (!response.ok) throw new Error('Failed to add furniture');

      const created = await response.json();
      const updatedItems = [...items, created];
      setItems(updatedItems);
      if (!devUnlimited) onSpendMoney?.(furnitureType.price);
      onItemsChanged?.(updatedItems);
      broadcastItems(updatedItems);
      addToHistory(updatedItems);
      showSuccess(`${furnitureType.emoji} ${furnitureType.type} добавлен за $${furnitureType.price}`);
      // Автозакрытие редактора после покупки, чтобы показать объект в комнате
      onClose?.();
    } catch (error) {
      showError('Ошибка при добавлении мебели');
    }
  };

  // Удалить выбранные объекты
  const handleDelete = async () => {
    if (selectedIds.length === 0) return;

    try {
      await Promise.all(
        selectedIds.map(id => 
          fetch(`http://localhost:3000/api/items/${id}`, { method: 'DELETE' })
        )
      );

      const updatedItems = items.filter(item => !selectedIds.includes(item.id!));
      setItems(updatedItems);
      setSelectedIds([]);
      onItemsChanged?.(updatedItems);
      broadcastItems(updatedItems);
      addToHistory(updatedItems);
      showSuccess(`Удалено объектов: ${selectedIds.length}`);
    } catch (error) {
      showError('Ошибка при удалении объектов');
    }
  };

  // Копировать выбранные объекты
  const handleCopy = () => {
    if (selectedIds.length === 0) return;
    const selectedItems = items.filter(item => selectedIds.includes(item.id!));
    setClipboard(JSON.parse(JSON.stringify(selectedItems)));
    showSuccess(`Скопировано объектов: ${selectedItems.length}`);
  };

  // Вставить из буфера
  const handlePaste = async () => {
    if (clipboard.length === 0) return;

    const newItems = clipboard.map(item => ({
      ...item,
      id: undefined,
      position: {
        x: snapValue(item.position.x + 1),
        y: item.position.y,
        z: snapValue(item.position.z + 1),
      },
    }));

    try {
      const responses = await Promise.all(
        newItems.map(item =>
          fetch(`http://localhost:3000/api/rooms/${roomId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
          }).then(r => r.json())
        )
      );

      const updatedItems = [...items, ...responses];
      setItems(updatedItems);
      onItemsChanged?.(updatedItems);
      broadcastItems(updatedItems);
      addToHistory(updatedItems);
      setSelectedIds(responses.map(r => r.id));
      showSuccess(`Вставлено объектов: ${responses.length}`);
    } catch (error) {
      showError('Ошибка при вставке объектов');
    }
  };

  // Дублировать выбранные
  const handleDuplicate = () => {
    handleCopy();
    handlePaste();
  };

  // Заблокировать/Разблокировать
  const handleToggleLock = async () => {
    if (selectedIds.length === 0) return;

    const updatedItems = items.map(item => {
      if (selectedIds.includes(item.id!)) {
        return { ...item, locked: !item.locked };
      }
      return item;
    });

    // TODO: Обновить на сервере
    setItems(updatedItems);
    broadcastItems(updatedItems);
    addToHistory(updatedItems);
    showSuccess('Блокировка изменена');
  };

  // Выровнять по стене
  const handleAlignToWall = (wall: 'north' | 'south' | 'east' | 'west') => {
    if (selectedIds.length === 0) return;

    const updatedItems = items.map(item => {
      if (!selectedIds.includes(item.id!)) return item;

      const furniture = FURNITURE_CATALOG.find(f => f.type === item.item_type);
      if (!furniture) return item;

      let newPos = { ...item.position };
      const offset = (furniture.dimensions.depth * item.scale) / 2;

      switch (wall) {
        case 'north':
          newPos.z = 9.5 - offset;
          break;
        case 'south':
          newPos.z = 0.5 + offset;
          break;
        case 'east':
          newPos.x = 9.5 - offset;
          break;
        case 'west':
          newPos.x = 0.5 + offset;
          break;
      }

      return { ...item, position: newPos };
    });

    setItems(updatedItems);
    broadcastItems(updatedItems);
    addToHistory(updatedItems);
    showSuccess('Объекты выровнены по стене');
  };

  // Применить шаблон комнаты
  const handleApplyTemplate = async (templateName: keyof typeof ROOM_TEMPLATES) => {
    const template = ROOM_TEMPLATES[templateName];
    if (!template) return;

    // Подсчитать стоимость
    let totalCost = 0;
    for (const item of template) {
      const furniture = FURNITURE_CATALOG.find(f => f.type === item.type);
      if (furniture) totalCost += furniture.price;
    }

    if (effectiveMoney < totalCost) {
      showError(`Недостаточно средств! Нужно $${totalCost}, есть $${money}`);
      return;
    }

    try {
      const responses = await Promise.all(
        template.map(item =>
          fetch(`http://localhost:3000/api/rooms/${roomId}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(item),
          }).then(r => r.json())
        )
      );

      const updatedItems = [...items, ...responses];
      setItems(updatedItems);
      if (!devUnlimited) onSpendMoney?.(totalCost);
      onItemsChanged?.(updatedItems);
      broadcastItems(updatedItems);
      addToHistory(updatedItems);
      showSuccess(`Шаблон "${templateName}" применён! (-$${totalCost})`);
    } catch (error) {
      showError('Ошибка при применении шаблона');
    }
  };

  // Очистить комнату
  const handleClearRoom = async () => {
    if (!confirm('Удалить всю мебель из комнаты?')) return;

    try {
      await Promise.all(
        items.map(item => fetch(`http://localhost:3000/api/items/${item.id}`, { method: 'DELETE' }))
      );

      setItems([]);
      setSelectedIds([]);
      onItemsChanged?.([]);
      broadcastItems([]);
      addToHistory([]);
      showSuccess('Комната очищена');
    } catch (error) {
      showError('Ошибка при очистке комнаты');
    }
  };

  // Горячие клавиши
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Z - Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Ctrl/Cmd + Shift + Z или Ctrl/Cmd + Y - Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
      // Ctrl/Cmd + C - Copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        handleCopy();
      }
      // Ctrl/Cmd + V - Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        handlePaste();
      }
      // Ctrl/Cmd + D - Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        handleDuplicate();
      }
      // Delete/Backspace - Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      }
      // Ctrl/Cmd + A - Select All
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        setSelectedIds(items.map(i => i.id!).filter(Boolean));
      }
      // Escape - Deselect
      if (e.key === 'Escape') {
        setSelectedIds([]);
      }
      // G - Toggle Grid
      if (e.key === 'g' || e.key === 'G') {
        setShowGrid(prev => !prev);
      }
      // Q - Switch to Select Mode
      if (e.key === 'q' || e.key === 'Q') {
        setEditMode('select');
      }
      // W - Switch to Move Mode
      if (e.key === 'w' || e.key === 'W') {
        setEditMode('move');
      }
      // E - Switch to Rotate Mode
      if (e.key === 'e' || e.key === 'E') {
        setEditMode('rotate');
      }
      // R - Switch to Scale Mode
      if (e.key === 'r' || e.key === 'R') {
        setEditMode('scale');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIds, undo, redo]);

  // Фильтрация каталога
  const filteredCatalog = FURNITURE_CATALOG.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = item.type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ['all', ...new Set(FURNITURE_CATALOG.map(f => f.category))];

  return (
    <div className="fixed inset-0 bg-black/95 z-50 flex">
      {/* Левая панель - Каталог мебели */}
      <div className="w-80 bg-slate-800 border-r border-slate-700 overflow-y-auto">
        <div className="p-4 border-b border-slate-700 sticky top-0 bg-slate-800 z-10">
          <h2 className="text-xl font-bold text-green-400 mb-4">
            🪑 Каталог мебели
          </h2>
          
          {/* Поиск */}
          <input
            type="text"
            placeholder="Поиск..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded text-white mb-3"
          />

          {/* Категории */}
          <div className="flex flex-wrap gap-2 mb-4">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded text-xs ${
                  selectedCategory === cat
                    ? 'bg-green-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="text-sm text-slate-400">
            Баланс: <span className="text-green-400 font-bold">${money}</span>
          </div>
        </div>

        {/* Список мебели */}
        <div className="p-4 space-y-2">
          {filteredCatalog.map(furniture => (
            <button
              key={furniture.type}
              onClick={() => handleAddFurniture(furniture)}
              disabled={money < furniture.price}
              className={`w-full p-3 rounded border text-left transition ${
                money >= furniture.price
                  ? 'bg-slate-700 border-slate-600 hover:bg-slate-600 hover:border-green-500'
                  : 'bg-slate-800 border-slate-700 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{furniture.emoji}</span>
                  <div>
                    <div className="text-white font-medium">{furniture.type.replace(/_/g, ' ')}</div>
                    <div className="text-xs text-slate-400">
                      {furniture.dimensions.width}×{furniture.dimensions.height}×{furniture.dimensions.depth}m
                    </div>
                  </div>
                </div>
                <div className={`font-bold ${money >= furniture.price ? 'text-green-400' : 'text-red-400'}`}>
                  ${furniture.price}
                </div>
              </div>
              {furniture.wallMount && <div className="text-xs text-blue-400 mt-1">📍 Крепится к стене</div>}
              {furniture.stackable && <div className="text-xs text-purple-400 mt-1">📦 Stackable</div>}
            </button>
          ))}
        </div>

        {/* Шаблоны комнат */}
        <div className="p-4 border-t border-slate-700">
          <h3 className="text-lg font-bold text-green-400 mb-3">🏠 Шаблоны комнат</h3>
          <div className="space-y-2">
            {Object.keys(ROOM_TEMPLATES).map(templateName => (
              <button
                key={templateName}
                onClick={() => handleApplyTemplate(templateName as keyof typeof ROOM_TEMPLATES)}
                className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white"
              >
                {templateName.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Центральная область - 3D вид */}
      <div className="flex-1 flex flex-col">
        {/* Верхняя панель инструментов */}
        <div className="bg-slate-800 border-b border-slate-700 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Режимы редактирования */}
            <div className="flex gap-1 bg-slate-700 rounded p-1">
              {(['select', 'move', 'rotate', 'scale'] as EditMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setEditMode(mode)}
                  className={`px-3 py-1 rounded text-sm ${
                    editMode === mode
                      ? 'bg-green-600 text-white'
                      : 'text-slate-300 hover:bg-slate-600'
                  }`}
                  title={`${mode.toUpperCase()} (${mode[0].toUpperCase()})`}
                >
                  {mode === 'select' && '👆'}
                  {mode === 'move' && '✋'}
                  {mode === 'rotate' && '🔄'}
                  {mode === 'scale' && '↔️'}
                </button>
              ))}
            </div>

            {/* История */}
            <div className="flex gap-1 bg-slate-700 rounded p-1">
              <button
                onClick={undo}
                disabled={historyIndex <= 0}
                className="px-3 py-1 rounded text-sm text-slate-300 hover:bg-slate-600 disabled:opacity-50"
                title="Undo (Ctrl+Z)"
              >
                ↶
              </button>
              <button
                onClick={redo}
                disabled={historyIndex >= history.length - 1}
                className="px-3 py-1 rounded text-sm text-slate-300 hover:bg-slate-600 disabled:opacity-50"
                title="Redo (Ctrl+Shift+Z)"
              >
                ↷
              </button>
            </div>

            {/* Операции с объектами */}
            <div className="flex gap-1 bg-slate-700 rounded p-1">
              <button
                onClick={handleCopy}
                disabled={selectedIds.length === 0}
                className="px-3 py-1 rounded text-sm text-slate-300 hover:bg-slate-600 disabled:opacity-50"
                title="Copy (Ctrl+C)"
              >
                📋
              </button>
              <button
                onClick={handlePaste}
                disabled={clipboard.length === 0}
                className="px-3 py-1 rounded text-sm text-slate-300 hover:bg-slate-600 disabled:opacity-50"
                title="Paste (Ctrl+V)"
              >
                📄
              </button>
              <button
                onClick={handleDuplicate}
                disabled={selectedIds.length === 0}
                className="px-3 py-1 rounded text-sm text-slate-300 hover:bg-slate-600 disabled:opacity-50"
                title="Duplicate (Ctrl+D)"
              >
                📑
              </button>
              <button
                onClick={handleDelete}
                disabled={selectedIds.length === 0}
                className="px-3 py-1 rounded text-sm text-red-400 hover:bg-red-900 disabled:opacity-50"
                title="Delete (Del)"
              >
                🗑️
              </button>
            </div>

            {/* Выравнивание */}
            <div className="flex gap-1 bg-slate-700 rounded p-1">
              <button
                onClick={() => handleAlignToWall('north')}
                disabled={selectedIds.length === 0}
                className="px-2 py-1 rounded text-sm text-slate-300 hover:bg-slate-600 disabled:opacity-50"
                title="Align to North Wall"
              >
                ↑
              </button>
              <button
                onClick={() => handleAlignToWall('south')}
                disabled={selectedIds.length === 0}
                className="px-2 py-1 rounded text-sm text-slate-300 hover:bg-slate-600 disabled:opacity-50"
                title="Align to South Wall"
              >
                ↓
              </button>
              <button
                onClick={() => handleAlignToWall('west')}
                disabled={selectedIds.length === 0}
                className="px-2 py-1 rounded text-sm text-slate-300 hover:bg-slate-600 disabled:opacity-50"
                title="Align to West Wall"
              >
                ←
              </button>
              <button
                onClick={() => handleAlignToWall('east')}
                disabled={selectedIds.length === 0}
                className="px-2 py-1 rounded text-sm text-slate-300 hover:bg-slate-600 disabled:opacity-50"
                title="Align to East Wall"
              >
                →
              </button>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Настройки сетки */}
            <label className="flex items-center gap-2 text-slate-300 text-sm">
              <input
                type="checkbox"
                checked={snapToGrid}
                onChange={(e) => setSnapToGrid(e.target.checked)}
                className="rounded"
              />
              Привязка к сетке
            </label>
            <input
              type="number"
              value={gridSize}
              onChange={(e) => setGridSize(parseFloat(e.target.value))}
              step="0.25"
              min="0.25"
              max="2"
              className="w-16 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm"
            />

            <button
              onClick={handleClearRoom}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-white text-sm"
            >
              🗑️ Очистить
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-white"
            >
              ✕ Закрыть
            </button>
          </div>
        </div>

        {/* 3D вид (заглушка - интегрируется с Room3D.tsx) */}
        <div className="flex-1 bg-slate-900 flex items-center justify-center text-slate-500">
          <div className="text-center">
            <div className="text-6xl mb-4">🏗️</div>
            <div className="text-xl">3D View Integration Point</div>
            <div className="text-sm mt-2">
              Выбрано объектов: {selectedIds.length} | 
              Всего объектов: {items.length} | 
              Режим: {editMode}
            </div>
          </div>
        </div>

        {/* Нижняя панель - Слои */}
        <div className="bg-slate-800 border-t border-slate-700 p-3">
          <div className="flex items-center gap-4">
            <span className="text-slate-400 text-sm">Слой высоты:</span>
            <div className="flex gap-2">
              {[0, 0.5, 1, 1.5, 2, 2.5, 3].map(layer => (
                <button
                  key={layer}
                  onClick={() => setCurrentLayer(layer)}
                  className={`px-3 py-1 rounded text-sm ${
                    currentLayer === layer
                      ? 'bg-green-600 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {layer}m
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Уведомления */}
      {errorMsg && (
        <div className="fixed top-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg animate-pulse">
          ⚠️ {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg">
          ✓ {successMsg}
        </div>
      )}

      {/* Справка по горячим клавишам */}
      <div className="fixed bottom-4 left-4 bg-slate-800/90 text-slate-300 text-xs p-3 rounded border border-slate-700">
        <div className="font-bold mb-2">⌨️ Горячие клавиши:</div>
        <div className="space-y-1">
          <div><kbd className="bg-slate-700 px-1 rounded">Q</kbd> Select | <kbd className="bg-slate-700 px-1 rounded">W</kbd> Move | <kbd className="bg-slate-700 px-1 rounded">E</kbd> Rotate | <kbd className="bg-slate-700 px-1 rounded">R</kbd> Scale</div>
          <div><kbd className="bg-slate-700 px-1 rounded">Ctrl+Z</kbd> Undo | <kbd className="bg-slate-700 px-1 rounded">Ctrl+Y</kbd> Redo</div>
          <div><kbd className="bg-slate-700 px-1 rounded">Ctrl+C</kbd> Copy | <kbd className="bg-slate-700 px-1 rounded">Ctrl+V</kbd> Paste | <kbd className="bg-slate-700 px-1 rounded">Ctrl+D</kbd> Duplicate</div>
          <div><kbd className="bg-slate-700 px-1 rounded">Del</kbd> Delete | <kbd className="bg-slate-700 px-1 rounded">G</kbd> Toggle Grid | <kbd className="bg-slate-700 px-1 rounded">Esc</kbd> Deselect</div>
        </div>
      </div>
    </div>
  );
}
