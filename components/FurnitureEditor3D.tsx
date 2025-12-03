import React, { useState, useEffect, useRef } from 'react';
import { playSound } from '../utils/sound';

interface FurnitureEditor3DProps {
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
}

const FURNITURE_TYPES: FurnitureType[] = [
  { type: 'sofa', emoji: '🛋', price: 500 },
  { type: 'chair', emoji: '🪑', price: 120 },
  { type: 'table', emoji: '🍽️', price: 320 },
  { type: 'coffee_table', emoji: '☕', price: 220 },
  { type: 'bed', emoji: '🛏️', price: 700 },
  { type: 'wardrobe', emoji: '🚪', price: 650 },
  { type: 'cabinet', emoji: '🗄️', price: 380 },
  { type: 'shelf', emoji: '📚', price: 400 },
  { type: 'plant', emoji: '🪴', price: 100 },
  { type: 'lamp', emoji: '💡', price: 150 },
  { type: 'picture', emoji: '🖼', price: 200 },
  { type: 'clock', emoji: '🕒', price: 140 },
  { type: 'rug', emoji: '🟥', price: 250 },
  { type: 'tv', emoji: '📺', price: 800 },
  { type: 'speaker', emoji: '🔊', price: 260 },
  { type: 'console', emoji: '🎮', price: 450 },
];

interface FurnitureItem {
  id?: number;
  item_type: string;
  position: { x: number; y: number; z: number };
  rotation?: number;
  scale?: number;
}

export default function FurnitureEditor3D({ roomId, onClose, money = 0, onSpendMoney, onItemsChanged }: FurnitureEditor3DProps) {
  const [items, setItems] = useState<FurnitureItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const bcRef = useRef<BroadcastChannel | null>(null);
  const devUnlimited = (typeof window !== 'undefined') && localStorage.getItem('dev-unlimited-money') === '1';
  const effectiveMoney = devUnlimited ? Number.MAX_SAFE_INTEGER : money;

  // Broadcast helper
  const broadcastItems = (newItems: FurnitureItem[]) => {
    try { bcRef.current?.postMessage({ roomId, items: newItems, source: '3d' }); } catch {}
  };

  // Load existing furniture
  useEffect(() => {
    // Setup BroadcastChannel to receive updates from 2D editor
    try {
      bcRef.current = new BroadcastChannel('room-items');
      bcRef.current.onmessage = (e: MessageEvent) => {
        const data = e.data || {};
        if (data.roomId === roomId && data.source !== '3d' && Array.isArray(data.items)) {
          setItems(data.items);
          onItemsChanged && onItemsChanged(data.items);
        }
      };
    } catch {}

    fetch(`http://localhost:3000/api/rooms/${roomId}/items`)
      .then(res => res.json())
      .then(data => setItems(data))
      .catch(console.error);
    return () => { try { bcRef.current?.close(); } catch {} };
  }, [roomId]);

  const selectedItem = items.find(item => item.id === selectedId);

  const handleAddFurniture = async (furnitureType: FurnitureType) => {
    // Economy check
    if (effectiveMoney < furnitureType.price) {
      try { playSound('error'); } catch {}
      setErrorMsg('Недостаточно средств для покупки этого предмета.');
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }
    const newItem: FurnitureItem = {
      item_type: furnitureType.type,
      position: { x: 50, y: 50, z: 0.5 },
      rotation: 0,
      scale: 1
    };

    try {
      const response = await fetch(`http://localhost:3000/api/rooms/${roomId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });

      if (response.ok) {
        const savedItem = await response.json();
        const updated = [...items, savedItem];
        setItems(updated);
        onItemsChanged && onItemsChanged(updated);
        broadcastItems(updated);
        // Spend only after successful save (skip in dev unlimited mode)
        if (!devUnlimited) onSpendMoney && onSpendMoney(furnitureType.price);
        try { playSound('success'); } catch {}
        // Автоматически выбрать добавленный объект и закрыть меню покупки
        setSelectedId(savedItem.id || null);
        onClose && onClose();
      } else {
        try { playSound('error'); } catch {}
        setErrorMsg('Ошибка сохранения. Проверьте соединение с сервером.');
        setTimeout(() => setErrorMsg(null), 3000);
      }
    } catch (error) {
      console.error('Failed to add furniture:', error);
      try { playSound('error'); } catch {}
      setErrorMsg('Ошибка сохранения. Проверьте соединение с сервером.');
      setTimeout(() => setErrorMsg(null), 3000);
    }
  };

  const handleUpdatePosition = async (x: number, y: number, z: number) => {
    if (!selectedId) return;

    const updatedItems = items.map(item =>
      item.id === selectedId
        ? { ...item, position: { x, y, z } }
        : item
    );
    setItems(updatedItems);
    onItemsChanged && onItemsChanged(updatedItems);
    broadcastItems(updatedItems);

    const item = updatedItems.find(i => i.id === selectedId);
    if (!item) return;

    setIsSaving(true);
    try {
      await fetch(`http://localhost:3000/api/rooms/${roomId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
    } catch (error) {
      console.error('Failed to update position:', error);
    }
    setIsSaving(false);
  };

  const handleUpdateRotation = async (rotation: number) => {
    if (!selectedId) return;

    const updatedItems = items.map(item =>
      item.id === selectedId
        ? { ...item, rotation }
        : item
    );
    setItems(updatedItems);
    onItemsChanged && onItemsChanged(updatedItems);
    broadcastItems(updatedItems);

    const item = updatedItems.find(i => i.id === selectedId);
    if (!item) return;

    setIsSaving(true);
    try {
      await fetch(`http://localhost:3000/api/rooms/${roomId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
    } catch (error) {
      console.error('Failed to update rotation:', error);
    }
    setIsSaving(false);
  };

  const handleUpdateScale = async (scale: number) => {
    if (!selectedId) return;

    const updatedItems = items.map(item =>
      item.id === selectedId
        ? { ...item, scale }
        : item
    );
    setItems(updatedItems);
    onItemsChanged && onItemsChanged(updatedItems);
    broadcastItems(updatedItems);

    const item = updatedItems.find(i => i.id === selectedId);
    if (!item) return;

    setIsSaving(true);
    try {
      await fetch(`http://localhost:3000/api/rooms/${roomId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
    } catch (error) {
      console.error('Failed to update scale:', error);
    }
    setIsSaving(false);
  };

  const handleDeleteItem = async (id: number) => {
    try {
      await fetch(`http://localhost:3000/api/items/${id}`, {
        method: 'DELETE'
      });
      const updated = items.filter(item => item.id !== id);
      setItems(updated);
      onItemsChanged && onItemsChanged(updated);
      broadcastItems(updated);
      if (selectedId === id) setSelectedId(null);
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  return (
    <div className="w-full h-full flex">
      {/* Error Toast */}
      {errorMsg && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[500] bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          <span className="text-xl">⚠️</span>
          <span className="font-medium">{errorMsg}</span>
        </div>
      )}
      
      {/* Sidebar - Furniture Catalog */}
      <div className="w-80 bg-slate-800 p-6 overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Furniture</h2>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            ✕ Close
          </button>
        </div>

        <div className="mb-4 text-slate-300">
          Баланс: <span className="font-bold text-white">{money.toLocaleString()}</span>
        </div>

        <div className="space-y-3">
          {FURNITURE_TYPES.map((furniture) => {
            const notEnough = furniture.price > money;
            return (
              <button
                key={furniture.type}
                onClick={() => handleAddFurniture(furniture)}
                disabled={notEnough}
                title={notEnough ? 'Недостаточно средств' : 'Купить и добавить'}
                className={`w-full p-4 rounded-lg transition-all text-left flex items-center justify-between group ${notEnough ? 'bg-slate-700/60 cursor-not-allowed opacity-60' : 'bg-slate-700 hover:bg-slate-600'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{furniture.emoji}</span>
                  <div>
                    <div className="font-medium capitalize">{furniture.type}</div>
                    <div className="text-sm text-slate-400">${furniture.price}</div>
                  </div>
                </div>
                <span className={`transition-opacity ${notEnough ? 'text-slate-400' : 'text-green-400 opacity-0 group-hover:opacity-100'}`}>
                  +
                </span>
              </button>
            );
          })}
        </div>

        {isSaving && (
          <div className="mt-4 text-center text-yellow-400">
            Saving...
          </div>
        )}
      </div>

      {/* Main Panel - Furniture List & Controls */}
      <div className="flex-1 bg-slate-900/50 p-6 overflow-y-auto">
        <h3 className="text-xl font-bold mb-4">Placed Furniture ({items.length})</h3>

        {items.length === 0 ? (
          <div className="text-center text-slate-400 py-12">
            <div className="text-4xl mb-4">🪑</div>
            <div>No furniture placed yet.</div>
            <div className="text-sm">Select items from the left panel to add them.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-lg transition-all ${
                  selectedId === item.id
                    ? 'bg-purple-600 ring-2 ring-purple-400'
                    : 'bg-slate-700 hover:bg-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">
                      {FURNITURE_TYPES.find(f => f.type === item.item_type)?.emoji || '📦'}
                    </span>
                    <div>
                      <div className="font-medium capitalize">{item.item_type}</div>
                      <div className="text-xs text-slate-300">ID: {item.id}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedId(item.id || null)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded transition-colors text-sm"
                    >
                      {selectedId === item.id ? '✓ Selected' : 'Select'}
                    </button>
                    <button
                      onClick={() => item.id && handleDeleteItem(item.id)}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded transition-colors text-sm"
                    >
                      🗑
                    </button>
                  </div>
                </div>

                {selectedId === item.id && selectedItem && (
                  <div className="border-t border-slate-600 pt-3 mt-3 space-y-3">
                    {/* Position Controls */}
                    <div>
                      <label className="text-sm text-slate-300 block mb-1">
                        Position X: {selectedItem.position.x.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.5"
                        value={selectedItem.position.x}
                        onChange={(e) => handleUpdatePosition(
                          parseFloat(e.target.value),
                          selectedItem.position.y,
                          selectedItem.position.z
                        )}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-slate-300 block mb-1">
                        Position Y: {selectedItem.position.y.toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.5"
                        value={selectedItem.position.y}
                        onChange={(e) => handleUpdatePosition(
                          selectedItem.position.x,
                          parseFloat(e.target.value),
                          selectedItem.position.z
                        )}
                        className="w-full"
                      />
                    </div>

                    <div>
                      <label className="text-sm text-slate-300 block mb-1">
                        Height Z: {(selectedItem.position.z || 0.5).toFixed(2)}
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="5"
                        step="0.1"
                        value={selectedItem.position.z || 0.5}
                        onChange={(e) => handleUpdatePosition(
                          selectedItem.position.x,
                          selectedItem.position.y,
                          parseFloat(e.target.value)
                        )}
                        className="w-full"
                      />
                    </div>

                    {/* Rotation Control */}
                    <div>
                      <label className="text-sm text-slate-300 block mb-1">
                        Rotation: {((selectedItem.rotation || 0) * 180 / Math.PI).toFixed(0)}°
                      </label>
                      <input
                        type="range"
                        min="0"
                        max={Math.PI * 2}
                        step="0.1"
                        value={selectedItem.rotation || 0}
                        onChange={(e) => handleUpdateRotation(parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>

                    {/* Scale Control */}
                    <div>
                      <label className="text-sm text-slate-300 block mb-1">
                        Scale: {(selectedItem.scale || 1).toFixed(2)}x
                      </label>
                      <input
                        type="range"
                        min="0.5"
                        max="2"
                        step="0.1"
                        value={selectedItem.scale || 1}
                        onChange={(e) => handleUpdateScale(parseFloat(e.target.value))}
                        className="w-full"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
