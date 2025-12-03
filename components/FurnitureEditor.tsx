import React, { useState, useEffect, useRef } from 'react';
import { playSound } from '../utils/sound';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface FurnitureItem {
  id: number;
  room_id: number;
  item_type: string;
  asset_id?: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  properties: any;
}

interface FurnitureEditorProps {
  roomId: number;
  onClose: () => void;
  money?: number;
  onSpendMoney?: (amount: number) => void;
}

const FURNITURE_CATALOG = [
  { type: 'sofa', name: '🛋 Sofa', emoji: '🛋', price: 500 },
  { type: 'chair', name: '🪑 Chair', emoji: '🪑', price: 120 },
  { type: 'table', name: '🍽️ Table', emoji: '🍽️', price: 320 },
  { type: 'coffee_table', name: '☕ Coffee Table', emoji: '☕', price: 220 },
  { type: 'bed', name: '🛏️ Bed', emoji: '🛏️', price: 700 },
  { type: 'wardrobe', name: '🚪 Wardrobe', emoji: '🚪', price: 650 },
  { type: 'cabinet', name: '🗄️ Cabinet', emoji: '🗄️', price: 380 },
  { type: 'shelf', name: '📚 Bookshelf', emoji: '📚', price: 400 },
  { type: 'plant', name: '🪴 Plant', emoji: '🪴', price: 100 },
  { type: 'lamp', name: '💡 Lamp', emoji: '💡', price: 150 },
  { type: 'picture', name: '🖼 Picture Frame', emoji: '🖼', price: 200 },
  { type: 'clock', name: '🕒 Wall Clock', emoji: '🕒', price: 140 },
  { type: 'rug', name: '🟥 Rug', emoji: '🟥', price: 250 },
  { type: 'tv', name: '📺 TV', emoji: '📺', price: 800 },
  { type: 'speaker', name: '🔊 Speaker', emoji: '🔊', price: 260 },
  { type: 'console', name: '🎮 Game Console', emoji: '🎮', price: 450 },
];

const DraggableFurniture: React.FC<{
  item: FurnitureItem;
  onMove: (id: number, x: number, y: number) => void;
  onDelete: (id: number) => void;
}> = ({ item, onMove, onDelete }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'furniture',
    item: { id: item.id, x: item.position.x, y: item.position.y },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const catalogItem = FURNITURE_CATALOG.find((f) => f.type === item.item_type);

  return (
    <div
      ref={drag}
      className={`absolute cursor-move select-none transition-opacity ${
        isDragging ? 'opacity-50' : 'opacity-100'
      }`}
      style={{
        left: `${item.position.x}px`,
        top: `${item.position.y}px`,
        transform: `rotate(${item.rotation.y}deg)`,
      }}
    >
      <div className="relative group">
        <div className="text-4xl">{catalogItem?.emoji || '📦'}</div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="absolute -top-2 -right-2 w-5 h-5 bg-red-600 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

const DropZone: React.FC<{
  children: React.ReactNode;
  onDrop: (x: number, y: number) => void;
}> = ({ children, onDrop }) => {
  const [, drop] = useDrop(() => ({
    accept: 'furniture',
    drop: (item: any, monitor) => {
      const offset = monitor.getClientOffset();
      const dropZone = document.getElementById('drop-zone');
      if (offset && dropZone) {
        const rect = dropZone.getBoundingClientRect();
        const x = offset.x - rect.left;
        const y = offset.y - rect.top;
        onDrop(x, y);
      }
    },
  }));

  return (
    <div
      ref={drop}
      id="drop-zone"
      className="relative w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-dashed border-slate-600 rounded-lg overflow-hidden"
    >
      {children}
    </div>
  );
};

export const FurnitureEditor: React.FC<FurnitureEditorProps> = ({ roomId, onClose, money = 0, onSpendMoney }) => {
  const [items, setItems] = useState<FurnitureItem[]>([]);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);

  const broadcastItems = (newItems: FurnitureItem[]) => {
    try { bcRef.current?.postMessage({ roomId, items: newItems, source: '2d' }); } catch {}
  };

  useEffect(() => {
    // Setup BroadcastChannel for live sync with 3D
    try {
      bcRef.current = new BroadcastChannel('room-items');
      bcRef.current.onmessage = (e: MessageEvent) => {
        const data: any = (e as any).data || {};
        if (data.roomId === roomId && data.source !== '2d' && Array.isArray(data.items)) {
          setItems(data.items);
        }
      };
    } catch {}
    fetchItems();
    return () => { try { bcRef.current?.close(); } catch {} };
  }, [roomId]);

  const fetchItems = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/rooms/${roomId}/items`);
      const data = await res.json();
      setItems(data);
    } catch (e) {
      console.error('Failed to fetch items:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = (type: string) => {
    const catalog = FURNITURE_CATALOG.find(f => f.type === type);
    if (catalog && catalog.price > money) {
      try { playSound('error'); } catch {}
      setErrorMsg('Недостаточно средств для покупки этого предмета.');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    setSelectedType(type);
  };

  const handleDrop = async (x: number, y: number) => {
    if (!selectedType) return;

    const newItem = {
      item_type: selectedType,
      position: { x, y, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
    };

    try {
      setSaving(true);
      const res = await fetch(`http://localhost:3000/api/rooms/${roomId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      const created = await res.json();
      const next = [...items, created];
      setItems(next);
      broadcastItems(next);
      // Spend after successful server save
      const catalog = FURNITURE_CATALOG.find(f => f.type === selectedType);
      if (catalog && onSpendMoney) onSpendMoney(catalog.price);
      setSelectedType(null);
    } catch (e) {
      console.error('Failed to add item:', e);
      try { playSound('error'); } catch {}
      setErrorMsg('Ошибка сохранения. Проверьте соединение с сервером.');
      setTimeout(() => setErrorMsg(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleMove = async (id: number, x: number, y: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const updated = { ...item, position: { ...item.position, x, y } };
    const next = items.map((i) => (i.id === id ? updated : i));
    setItems(next);
    broadcastItems(next);

    try {
      await fetch(`http://localhost:3000/api/rooms/${roomId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...updated, id: undefined }),
      });
    } catch (e) {
      console.error('Failed to update item:', e);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`http://localhost:3000/api/items/${id}`, { method: 'DELETE' });
      const next = items.filter((i) => i.id !== id);
      setItems(next);
      broadcastItems(next);
    } catch (e) {
      console.error('Failed to delete item:', e);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-md flex">
        {/* Error Toast */}
        {errorMsg && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
            <span className="text-xl">⚠️</span>
            <span className="font-medium">{errorMsg}</span>
          </div>
        )}
        
        <div className="flex-1 flex flex-col p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              🛠 Furniture Editor
            </h2>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-colors"
            >
              ✓ Done
            </button>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-white">Loading...</div>
          ) : (
            <DropZone onDrop={handleDrop}>
              {items.map((item) => (
                <DraggableFurniture
                  key={item.id}
                  item={item}
                  onMove={handleMove}
                  onDelete={handleDelete}
                />
              ))}
              {selectedType && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg animate-pulse">
                  Click anywhere to place {FURNITURE_CATALOG.find((f) => f.type === selectedType)?.name}
                </div>
              )}
            </DropZone>
          )}
        </div>

        <div className="w-64 bg-slate-900 border-l border-slate-700 p-4 overflow-y-auto">
          <h3 className="text-lg font-bold text-white mb-2">Furniture Catalog</h3>
          <div className="mb-4 text-slate-300">Баланс: <span className="font-bold text-white">{money.toLocaleString()}</span></div>
          <div className="space-y-2">
            {FURNITURE_CATALOG.map((item) => {
              const notEnough = (money || 0) < item.price;
              return (
                <button
                  key={item.type}
                  onClick={() => handleAddItem(item.type)}
                  disabled={notEnough}
                  title={notEnough ? 'Недостаточно средств' : 'Выбрать для размещения'}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    selectedType === item.type
                      ? 'bg-purple-600 text-white'
                      : notEnough
                        ? 'bg-slate-800/60 text-white cursor-not-allowed opacity-60'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{item.emoji}</span>
                    <div>
                      <div className="font-bold text-sm">{item.name}</div>
                      <div className="text-xs opacity-70">${item.price}</div>
                    </div>
                    <div className="ml-auto text-xs text-red-400">{notEnough ? 'Недостаточно' : ''}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {saving && (
            <div className="mt-4 text-center text-green-400 text-sm">Saving...</div>
          )}
        </div>
      </div>
    </DndProvider>
  );
};
