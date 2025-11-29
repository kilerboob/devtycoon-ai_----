
import React, { useState, useEffect } from 'react';
import { HARDWARE_CATALOG } from '../constants';
import { DarkHub } from './DarkHub';
import { CyberBay } from './CyberBay';
import { UserAppRunner } from './UserAppRunner';
import { UserApp, GameState, InventoryItem, NewsArticle } from '../types';
import { devFsService } from '../services/devFsService';
import { siteService, SiteMeta, SiteContent } from '../services/siteService';

interface BrowserProps {
  onClose: () => void;
  money: number;
  inventory: InventoryItem[];
  isShadowUnlocked: boolean;
  onBuy: (id: string, isShadow?: boolean) => void;
  onSell: (id: string, value: number) => void;
  shadowCredits?: number;
  globalHeat?: number;
  onExchange?: (amount: number) => void;
  userApps: UserApp[];
  gameState: GameState;
  onStartHack: () => void;
}

export const Browser: React.FC<BrowserProps> = ({ onClose, money, inventory, isShadowUnlocked, onBuy, onSell, shadowCredits = 0, globalHeat = 0, onExchange = () => {}, userApps, gameState, onStartHack }) => {
  const [url, setUrl] = useState('cyber-amazon.com');
  const [currentUrl, setCurrentUrl] = useState('cyber-amazon.com');
  const [page, setPage] = useState<'shop' | 'news' | 'shadow' | 'resale' | 'user' | 'site' | '404'>('shop');
  const [currentUserApp, setCurrentUserApp] = useState<UserApp | null>(null);
  const [siteHtml, setSiteHtml] = useState('');
  const [siteName, setSiteName] = useState('');
  const [filter, setFilter] = useState('all');
  const [accessTimeLeft, setAccessTimeLeft] = useState('');
  const [devFsSites, setDevFsSites] = useState<SiteMeta[]>([]);
  const [showSiteList, setShowSiteList] = useState(false);

  // Load DevFS sites on mount
  useEffect(() => {
      loadDevFsSites();
  }, []);

  const loadDevFsSites = async () => {
      const sites = await siteService.listSites();
      setDevFsSites(sites);
  };

  // Access Timer Logic
  useEffect(() => {
      const timer = setInterval(() => {
          if (gameState.shadowAccessExpiry && gameState.shadowAccessExpiry > Date.now()) {
              const diff = gameState.shadowAccessExpiry - Date.now();
              const h = Math.floor(diff / 3600000);
              const m = Math.floor((diff % 3600000) / 60000);
              setAccessTimeLeft(`${h}h ${m}m`);
          } else {
              setAccessTimeLeft('');
          }
      }, 1000);
      return () => clearInterval(timer);
  }, [gameState.shadowAccessExpiry]);

  // Check if Signal is active
  const isSignalActive = gameState.signalEndTime && gameState.signalEndTime > Date.now();
  // Check if Access is active
  const isAccessActive = gameState.shadowAccessExpiry && gameState.shadowAccessExpiry > Date.now();

  // Navigation Logic
  const navigate = (targetUrl: string) => {
      let cleanUrl = targetUrl.replace(/^https?:\/\//, '').toLowerCase();
      
      // Handle DevFS sites (e.g., /sites/mysite, sites/mysite, mysite.local)
      if (cleanUrl.startsWith('/sites/') || cleanUrl.startsWith('sites/')) {
          const siteName = cleanUrl.replace(/^\/?sites\//, '');
          loadSite(siteName);
          return;
      }

      // Handle .local TLD as DevFS site (e.g., mysite.local)
      if (cleanUrl.endsWith('.local')) {
          const siteName = cleanUrl.replace('.local', '');
          loadSite(siteName);
          return;
      }

      if (targetUrl.startsWith('ang://')) {
          cleanUrl = targetUrl; 
          const domain = targetUrl.replace('ang://', '').split('/')[0];
          const app = userApps.find(a => a.domain === domain);
          if (app) {
              setCurrentUserApp(app);
              setPage('user');
              setUrl(targetUrl);
              setCurrentUrl(targetUrl);
              return;
          } else {
              setPage('404');
              setUrl(targetUrl);
              setCurrentUrl(targetUrl);
              return;
          }
      }

      setUrl(cleanUrl);
      setCurrentUrl(cleanUrl);

      if (cleanUrl === 'cyber-amazon.com' || cleanUrl === 'www.cyber-amazon.com') {
          setPage('shop');
      } else if (cleanUrl === 'cyberbay.market' || cleanUrl === 'cyberbay.com') {
          setPage('resale');
      } else if (cleanUrl === 'tech-news.net') {
          setPage('news');
      } else if (cleanUrl === '192.168.0.666' || cleanUrl === '192.168.0.666/onion') {
          if (isAccessActive) setPage('shadow');
          else setPage('404');
      } else if (cleanUrl === 'darkhub') {
          if (isAccessActive) { setPage('shadow'); setUrl('192.168.0.666'); setCurrentUrl('192.168.0.666'); }
          else setPage('404');
      } else {
          setPage('404');
      }
  };

  // Load site from DevFS
  const loadSite = async (siteNameParam: string) => {
      try {
          const content = await siteService.loadSite(siteNameParam);
          if (content) {
              setSiteName(siteNameParam);
              setSiteHtml(siteService.renderSiteWithStyles(content));
              setPage('site');
              setUrl(`${siteNameParam}.local`);
              setCurrentUrl(`${siteNameParam}.local`);
          } else {
              setPage('404');
              setUrl(`${siteNameParam}.local`);
              setCurrentUrl(`${siteNameParam}.local`);
          }
      } catch (e) {
          console.error('Failed to load site:', e);
          setPage('404');
          setUrl(`${siteNameParam}.local`);
          setCurrentUrl(`${siteNameParam}.local`);
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          navigate(url);
      }
  };

  const renderShop = () => {
    const items = HARDWARE_CATALOG.filter(i => !i.isIllegal);
    return (
    <div className="p-6 min-h-full">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {['all', 'case', 'monitor', 'cpu', 'gpu', 'ram', 'storage', 'decor', 'wall'].map(f => (
                <button 
                    key={f} 
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1 rounded text-xs font-bold uppercase transition-colors whitespace-nowrap ${filter === f ? 'bg-orange-500 text-white' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
                >
                    {f}
                </button>
            ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.filter(i => filter === 'all' || i.type === filter || (filter === 'wall' && (i.type === 'wall' || i.type === 'poster'))).map(item => {
                const count = inventory.filter(inv => inv.itemId === item.id).length;
                const trend = gameState.marketTrends ? (gameState.marketTrends[item.type] || 1) : 1;
                const price = Math.floor(item.cost * trend);
                const isInflated = trend > 1.05;
                const isDeflated = trend < 0.95;

                return (
                    <div key={item.id} className="rounded shadow-sm border p-4 flex flex-col hover:shadow-md transition-shadow bg-white border-slate-200">
                        <div className={`h-32 rounded mb-4 flex items-center justify-center relative overflow-hidden ${item.visualClass.includes('bg-') && !item.visualClass.includes('url') ? item.visualClass : 'bg-slate-100'}`}>
                            {item.visualClass.includes('url') && <div className={`absolute inset-0 ${item.visualClass} bg-cover bg-center`}></div>}
                            <div className="text-4xl relative z-10 drop-shadow-md">
                                {item.type === 'case' && '🖥️'}
                                {item.type === 'monitor' && '📺'}
                                {item.type === 'keyboard' && '⌨️'}
                                {item.type === 'mouse' && '🖱️'}
                                {item.type === 'decor' && '🌵'}
                                {item.type === 'cpu' && '🧠'}
                                {item.type === 'gpu' && '🎮'}
                                {item.type === 'ram' && '⚡'}
                                {item.type === 'storage' && '💾'}
                                {item.type === 'wall' && '🧱'}
                                {item.type === 'poster' && '🖼️'}
                                {item.type === 'cooler' && '❄️'}
                            </div>
                        </div>
                        <div className="flex justify-between items-start">
                            <h3 className="font-bold text-slate-800">{item.name}</h3>
                            <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-1 rounded">{item.type}</span>
                        </div>
                        <p className="text-sm flex-1 mb-4 mt-1 text-slate-500">{item.description}</p>
                        
                        <div className="mb-4 text-xs font-mono">
                            {item.effect.type === 'auto_code' && <span className="text-blue-500">+{item.effect.value} LOC/s</span>}
                            {item.effect.type === 'click_power' && <span className="text-green-500">+{item.effect.value} Click</span>}
                            {item.effect.type === 'heat' && <span className="text-red-500">+{item.effect.value} HEAT 🔥</span>}
                            {item.effect.type === 'cooling' && <span className="text-cyan-500">-{item.effect.value} COOL ❄️</span>}
                        </div>

                        <div className="flex justify-between items-center mt-auto">
                            <div className="flex flex-col">
                                <span className={`font-bold text-lg ${isInflated ? 'text-red-500' : isDeflated ? 'text-green-500' : 'text-slate-900'}`}>
                                    ${price}
                                </span>
                                {isInflated && <span className="text-[10px] text-red-500">High Demand ▲</span>}
                                {isDeflated && <span className="text-[10px] text-green-500">SALE ▼</span>}
                            </div>
                            <div className="flex items-center gap-2">
                                {count > 0 && <span className="text-xs text-slate-400">Owned: {count}</span>}
                                <button 
                                    onClick={() => onBuy(item.id, false)}
                                    disabled={money < price}
                                    className={`px-4 py-1 rounded text-sm font-bold text-white transition-colors ${money >= price ? 'bg-orange-500 hover:bg-orange-600' : 'bg-slate-300 cursor-not-allowed'}`}
                                >
                                    Купить
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    </div>
    );
  };

  const renderNews = () => (
      <div className="p-6 space-y-6 max-w-3xl mx-auto">
          <div className="flex justify-between items-end border-b border-slate-300 pb-4 mb-6">
              <div>
                  <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Tech-News.net</h1>
                  <p className="text-slate-500 text-sm">Your daily source for hardware & cybersec.</p>
              </div>
              <div className="text-xs text-slate-400">{new Date().toLocaleDateString()}</div>
          </div>

          <div className="space-y-4">
              {gameState.news.slice().reverse().map((article, i) => (
                  <div key={article.id} className={`bg-white border-l-4 p-6 shadow-sm transition-transform hover:scale-[1.01] ${
                      article.impact === 'inflation' ? 'border-red-500' : 
                      article.impact === 'deflation' ? 'border-green-500' : 
                      'border-blue-500'
                  }`}>
                      <div className="flex justify-between items-start mb-2">
                          <span className={`text-xs font-bold px-2 py-1 rounded uppercase ${
                              article.category === 'CRYPTO' ? 'bg-orange-100 text-orange-600' :
                              article.category === 'SECURITY' ? 'bg-red-100 text-red-600' :
                              article.category === 'HARDWARE' ? 'bg-blue-100 text-blue-600' :
                              'bg-slate-100 text-slate-600'
                          }`}>
                              {article.category}
                          </span>
                          <span className="text-xs text-slate-400">{new Date(article.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <h2 className="text-xl font-bold text-slate-900 mb-2">{article.headline}</h2>
                      <p className="text-slate-600 leading-relaxed">{article.content}</p>
                  </div>
              ))}
              
              {gameState.news.length === 0 && (
                  <div className="text-center py-20 text-slate-400 italic">No news is good news. Check back later.</div>
              )}
          </div>
      </div>
  );

  const render404 = () => (
      <div className="flex flex-col items-center justify-center h-full text-slate-400">
          <div className="text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-slate-600">404 Not Found</h1>
          <p>Сервер {currentUrl} не отвечает.</p>
      </div>
  );

  const renderSite = () => (
      <div className="w-full h-full overflow-auto bg-white">
          <div 
              className="w-full min-h-full p-6"
              dangerouslySetInnerHTML={{ __html: siteHtml }}
          />
      </div>
  );

  return (
    <div className="absolute top-10 left-10 right-10 bottom-10 bg-slate-100 rounded-lg shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300 z-50">
        {/* Browser Top Bar */}
        <div className="h-10 bg-slate-200 border-b border-slate-300 flex items-center px-2 gap-2">
            <div className="flex gap-1.5">
                <div onClick={onClose} className="w-3 h-3 rounded-full bg-red-500 cursor-pointer hover:bg-red-600"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="flex gap-1 ml-4 text-slate-500">
                <button onClick={() => {}} className="hover:text-slate-800">◀</button>
                <button onClick={() => {}} className="hover:text-slate-800">▶</button>
                <button onClick={() => navigate(currentUrl)} className="hover:text-slate-800">↻</button>
            </div>
            <div className="flex-1 relative">
                <input 
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className={`w-full rounded-md h-7 px-8 text-sm shadow-inner outline-none transition-colors ${page === 'shadow' ? 'bg-[#222] text-red-500 border border-red-900' : 'bg-white text-slate-600'}`}
                />
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs opacity-50">🔒</span>
            </div>
        </div>
        
        {/* Bookmarks */}
        <div className="h-8 bg-slate-50 border-b border-slate-200 flex items-center px-2 gap-4 text-xs font-bold text-slate-600 overflow-x-auto">
            <button onClick={() => navigate('cyber-amazon.com')} className={`hover:text-orange-500 ${page === 'shop' ? 'text-orange-600 underline' : ''}`}>CyberAmazon</button>
            <button onClick={() => navigate('cyberbay.market')} className={`hover:text-blue-500 ${page === 'resale' ? 'text-blue-600 underline' : ''}`}>CyberBay</button>
            <button onClick={() => navigate('tech-news.net')} className={`hover:text-blue-500 ${page === 'news' ? 'text-blue-600 underline' : ''}`}>Tech News</button>
            
            {/* DevFS Sites dropdown */}
            <div className="relative">
                <button 
                    onClick={() => { loadDevFsSites(); setShowSiteList(!showSiteList); }}
                    className={`hover:text-green-600 flex items-center gap-1 ${page === 'site' ? 'text-green-600 underline' : ''}`}
                >
                    📁 Sites {devFsSites.length > 0 && `(${devFsSites.length})`}
                </button>
                {showSiteList && (
                    <div className="absolute top-6 left-0 bg-white border border-slate-200 rounded shadow-lg z-50 min-w-[150px]">
                        {devFsSites.map(site => (
                            <button 
                                key={site.name}
                                onClick={() => { loadSite(site.name); setShowSiteList(false); }}
                                className="w-full text-left px-3 py-2 hover:bg-slate-100 text-sm"
                            >
                                🌐 {site.name}.local
                            </button>
                        ))}
                        {devFsSites.length === 0 && (
                            <div className="px-3 py-2 text-slate-400 text-sm">Нет сайтов</div>
                        )}
                    </div>
                )}
            </div>

            {userApps.map(app => app.domain && (
                <button key={app.id} onClick={() => navigate(`ang://${app.domain}`)} className="text-purple-600 hover:text-purple-800 flex items-center gap-1">
                    <span>{app.icon}</span> {app.domain}
                </button>
            ))}

            {/* SIGNAL / DARKHUB BUTTON */}
            {isAccessActive ? (
                <button 
                    onClick={() => navigate('192.168.0.666')} 
                    className={`ml-auto flex items-center gap-1 px-2 transition-all text-red-600 underline hover:text-red-500 bg-black border border-red-900 ${page === 'shadow' ? 'bg-red-950' : ''}`}
                    title="DarkHub Connection Active"
                >
                    <span>💀 DarkHub [{accessTimeLeft}]</span>
                </button>
            ) : isSignalActive ? (
                <button 
                    onClick={onStartHack}
                    className="ml-auto flex items-center gap-1 px-2 transition-all bg-red-600 text-white border border-red-800 animate-pulse font-bold shadow-[0_0_10px_red]"
                    title="Intercept Signal Now!"
                >
                    <span>🔒 SIGNAL DETECTED</span>
                </button>
            ) : (
                <span className="ml-auto text-xs text-slate-300 italic px-2">No Signal...</span>
            )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50 relative">
            {page === 'shop' && renderShop()}
            {page === 'shadow' && (
                <DarkHub 
                    onClose={onClose} 
                    shadowCredits={shadowCredits}
                    money={money}
                    globalHeat={globalHeat}
                    onBuy={onBuy}
                    onExchange={onExchange}
                    accessExpiry={gameState.shadowAccessExpiry}
                />
            )}
            {page === 'resale' && (
                <CyberBay 
                    onClose={onClose} 
                    inventory={inventory} 
                    onSell={onSell} 
                    marketTrends={gameState.marketTrends}
                />
            )}
            {page === 'news' && renderNews()}
            {page === 'user' && currentUserApp && (
                <div className="w-full h-full">
                    <UserAppRunner code={currentUserApp.code} gameState={gameState} />
                </div>
            )}
            {page === 'site' && renderSite()}
            {page === '404' && render404()}
        </div>
    </div>
  );
};
