import React, { useEffect, useState } from 'react';

interface Item {
  id: number;
  category: 'software'|'hardware'|'services';
  name: string;
  description?: string;
  base_price: number;
  stock: number;
  rarity?: string;
}

export default function MarketApp() {
  const [category, setCategory] = useState<'software'|'hardware'|'services'|''>('');
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|undefined>();

  useEffect(() => {
    setLoading(true);
    const url = category ? `/api/market/items?category=${category}` : '/api/market/items';
    fetch(url)
      .then(r => r.json())
      .then(setItems)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [category]);

  const buy = async (item: Item) => {
    try {
      const res = await fetch('/api/market/buy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'player', itemId: item.id, quantity: 1 })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Buy failed');
      alert(`✅ Покупка успешна: ${item.name}\n💰 Итого: ${data.total}\n📊 Комиссия: ${data.commission}`);
      // Refresh list
      setCategory(c => c);
    } catch (e: any) {
      alert('❌ ' + e.message);
    }
  };

  const sell = async (item: Item) => {
    try {
      const res = await fetch('/api/market/sell', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'player', itemId: item.id, quantity: 1, unitPrice: item.base_price })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Sell failed');
      alert(`✅ Продажа оформлена: ${item.name}\n💰 Итого: ${data.total}\n📊 Комиссия: ${data.commission}`);
      // Refresh list
      setCategory(c => c);
    } catch (e: any) {
      alert('❌ ' + e.message);
    }
  };

  const rarityColor = (rarity?: string) => {
    switch(rarity) {
      case 'legendary': return 'text-orange-400';
      case 'rare': return 'text-purple-400';
      case 'uncommon': return 'text-blue-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="p-4 h-full flex flex-col bg-slate-900">
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-white mb-2">🛒 Легальный рынок</h2>
        <p className="text-slate-400 text-sm">Покупайте и продавайте ПО, железо и услуги</p>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <button 
          className={`px-3 py-1 rounded transition-colors ${category===''?'bg-blue-600 text-white':'bg-slate-700 text-slate-200 hover:bg-slate-600'}`} 
          onClick={()=>setCategory('')}
        >
          Все
        </button>
        <button 
          className={`px-3 py-1 rounded transition-colors ${category==='software'?'bg-blue-600 text-white':'bg-slate-700 text-slate-200 hover:bg-slate-600'}`} 
          onClick={()=>setCategory('software')}
        >
          💻 Software
        </button>
        <button 
          className={`px-3 py-1 rounded transition-colors ${category==='hardware'?'bg-blue-600 text-white':'bg-slate-700 text-slate-200 hover:bg-slate-600'}`} 
          onClick={()=>setCategory('hardware')}
        >
          🔧 Hardware
        </button>
        <button 
          className={`px-3 py-1 rounded transition-colors ${category==='services'?'bg-blue-600 text-white':'bg-slate-700 text-slate-200 hover:bg-slate-600'}`} 
          onClick={()=>setCategory('services')}
        >
          📦 Services
        </button>
      </div>

      {loading && <div className="text-slate-300">Загрузка…</div>}
      {error && <div className="text-red-400">❌ Ошибка: {error}</div>}

      <div className="grid grid-cols-3 gap-3 overflow-auto flex-1">
        {items.map(item => (
          <div key={item.id} className="bg-[#1e1e1e] border border-slate-700 rounded p-3 flex flex-col hover:border-slate-500 transition-colors">
            <div className="flex justify-between items-start mb-1">
              <div className="font-bold text-slate-200">{item.name}</div>
              {item.rarity && <span className={`text-xs font-bold uppercase ${rarityColor(item.rarity)}`}>{item.rarity}</span>}
            </div>
            <div className="text-xs text-slate-400 mb-2">{item.category}</div>
            {item.description && <div className="text-sm text-slate-300 mb-2 flex-1">{item.description}</div>}
            <div className="mt-auto">
              <div className="flex justify-between items-center mb-2">
                <span className="text-green-400 font-bold">${item.base_price}</span>
                <span className="text-slate-400 text-xs">Склад: {item.stock}</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={()=>buy(item)} 
                  disabled={item.stock === 0}
                  className="flex-1 px-2 py-1 bg-green-600 hover:bg-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm rounded transition-colors"
                >
                  Купить
                </button>
                <button 
                  onClick={()=>sell(item)} 
                  className="flex-1 px-2 py-1 bg-yellow-600 hover:bg-yellow-500 text-white text-sm rounded transition-colors"
                >
                  Продать
                </button>
              </div>
            </div>
          </div>
        ))}
        {items.length === 0 && !loading && (
          <div className="col-span-3 text-center text-slate-400 py-8">
            Товаров пока нет
          </div>
        )}
      </div>
    </div>
  );
}
