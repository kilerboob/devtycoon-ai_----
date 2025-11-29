

import { SkillLevel, Quest, HardwareItem, Message, ProjectTemplate, UserApp, SkillPerk, ProgrammingLanguage, InventoryItem, GameState, FileNode, Language, HardwareType } from './types';

// Helper to generate IDs
const uuid = () => Math.random().toString(36).substr(2, 9);

const createStarterInventory = (): InventoryItem[] => {
    const starterIds = [
        'case_basic', 'monitor_crt', 'kb_office', 'mouse_office', 'pad_basic',
        'cpu_basic', 'gpu_integrated', 'ram_4gb', 'hdd_old', 'cooler_stock',
        'wall_paint_grey', 'poster_none', 'desk_wood', 'chair_stool', 'window_wall', 'hp_none', 'sp_none'
    ];
    return starterIds.map(id => ({
        uid: `start_${id}_${uuid()}`,
        itemId: id,
        isStolen: false,
        durability: 100
    }));
};

const STARTER_INV = createStarterInventory();

// Helper to map starter inventory UIDs to equipped slots
const getStarterEquipped = (inv: InventoryItem[]) => {
    const eq: any = {};
    inv.forEach(item => {
        // Find type
        const catalogItem = HARDWARE_CATALOG.find(h => h.id === item.itemId);
        if (catalogItem) {
            eq[catalogItem.type] = item.uid;
        }
    });
    return eq as GameState['equipped'];
};

export const BANK_CONSTANTS = {
    ELECTRICITY_RATE_PER_WATT: 0.15, // $ per day per watt
    INTERNET_COST_BASIC: 10, // $ per day
    TRAFFIC_REVENUE_PER_VISITOR: 0.02, // $ per user
};

// --- LIVING WORLD TEMPLATES ---

export const NEWS_TEMPLATES = {
    inflation: {
        gpu: [
            { t: "Crypto Boom Drives GPU Shortage", c: "Miners are buying every card in sight. Expect prices to skyrocket.", cat: 'CRYPTO' },
            { t: "Silicon Foundry Fire", c: "A major factory fire in Taiwan has halted GPU production. Prices surge +20%.", cat: 'HARDWARE' },
            { t: "AI Startups Hoard Graphics Cards", c: "The AI revolution needs compute power. Gamers are left with nothing.", cat: 'TECH' }
        ],
        cpu: [
            { t: "New Military Contracts for CPUs", c: "The defense sector is buying high-end processors, creating a market deficit.", cat: 'WORLD' },
            { t: "Rare Earth Metal Shortage", c: "Supply chain issues affect CPU manufacturing costs globally.", cat: 'HARDWARE' }
        ],
        ram: [
            { t: "DDR6 Factories Delayed", c: "Production delays mean current RAM stocks are valuable.", cat: 'HARDWARE' }
        ],
        generic: [
            { t: "Inflation Hits Tech Sector", c: "Everything is getting more expensive due to global economic shifts.", cat: 'FINANCE' }
        ]
    },
    deflation: {
        gpu: [
            { t: "Crypto Crash!", c: "Miners are flooding CyberBay with used GPUs. Prices are crashing.", cat: 'CRYPTO' },
            { t: "Next-Gen GPU Announced", c: "Current gen cards are obsolete. Retailers are dumping stock.", cat: 'HARDWARE' }
        ],
        cpu: [
            { t: "Breakthrough in Quantum Computing", c: "Traditional CPUs see a drop in value as quantum tech looms.", cat: 'TECH' },
            { t: "Market Oversupply", c: "Warehouses are full of unsold processors. Great time to buy.", cat: 'FINANCE' }
        ],
        generic: [
            { t: "Tech Market Correction", c: "Analysts say hardware was overvalued. Prices returning to normal.", cat: 'FINANCE' }
        ]
    }
};

export const EMAIL_TEMPLATES = {
    spam: [
        { s: "Enlarge your... bandwidth?", b: "Download this RAM doubler now! Totally legit. Link: http://virus.exe" },
        { s: "Prince needs your help", b: "I am a Nigerian Prince with 50 million USD. Send me your bank details." },
        { s: "HOT SINGLES IN YOUR AREA", b: "They want to see your code. Click here." }
    ],
    job: [
        { s: "Freelance Opportunity", b: "We need a quick script to parse some logs. Pay: $200. Interested?" },
        { s: "Startup Offer", b: "Join our team as a Junior Dev. We pay in equity (tokens). You in?" },
        { s: "Contract Work: Web Scraper", b: "Need data from a competitor site. Discreetly. Pay is good." }
    ],
    threat: [
        { s: "We know what you did.", b: "Stop using the DarkHub or we will leak your browser history." },
        { s: "ISP Warning: Unusual Traffic", b: "We detected high-grade encryption coming from your node. Explain." }
    ],
    story: [
        { s: "The Architect", b: "You are waking up, Neo. The code you write changes reality. Keep pushing." }
    ]
};

export const FILE_SYSTEM_INIT: FileNode = {
    id: 'root',
    name: 'root',
    type: 'folder',
    createdAt: Date.now(),
    children: [
        {
            id: 'folder_projects',
            name: 'projects',
            type: 'folder',
            createdAt: Date.now(),
            children: [
                {
                    id: 'file_hello',
                    name: 'hello.js',
                    type: 'file',
                    language: 'javascript',
                    content: '// Welcome to DevOS v3.0\nconsole.log("Hello World");',
                    createdAt: Date.now()
                }
            ]
        },
        {
            id: 'folder_downloads',
            name: 'downloads',
            type: 'folder',
            createdAt: Date.now(),
            children: []
        },
        {
            id: 'file_readme',
            name: 'README.txt',
            type: 'file',
            language: 'javascript',
            content: 'DO NOT DELETE SYSTEM FILES.\nProperty of CyberTech Corp.',
            createdAt: Date.now()
        }
    ]
};

export const HARDWARE_CATALOG: HardwareItem[] = [
    // CASES
    { id: 'case_basic', type: 'case', name: 'Старый ящик', cost: 0, resaleValue: 0, description: 'Шумит как пылесос.', visualClass: 'bg-slate-700', effect: { type: 'auto_code', value: 0 } },
    { id: 'case_rgb', type: 'case', name: 'Gamer X RGB', cost: 1500, resaleValue: 800, description: 'Подсветка дает +10 FPS.', visualClass: 'bg-black border-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]', effect: { type: 'auto_code', value: 5 } },
    { id: 'case_server', type: 'case', name: 'Home Server Rack', cost: 5000, resaleValue: 3000, description: 'Личная серверная стойка.', visualClass: 'bg-slate-900 border border-green-500 h-full', effect: { type: 'auto_code', value: 25 } },

    // MONITORS
    { id: 'monitor_crt', type: 'monitor', name: 'CRT 15"', cost: 0, resaleValue: 0, description: 'Глаза болят через час.', visualClass: 'bg-slate-800 rounded-lg border-4 border-slate-600', effect: { type: 'luck', value: 0 } },
    { id: 'monitor_led', type: 'monitor', name: 'Dual LED 24"', cost: 800, resaleValue: 400, description: 'Два экрана - двойная продуктивность.', visualClass: 'bg-black border-x-8 border-slate-800 w-[140%]', effect: { type: 'click_power', value: 2 } },
    { id: 'monitor_ultrawide', type: 'monitor', name: 'Odyssey Ultrawide', cost: 2500, resaleValue: 1500, description: 'Видно весь код сразу.', visualClass: 'bg-black border-t-2 border-b-8 border-slate-800 rounded-xl w-[180%] shadow-lg', effect: { type: 'click_power', value: 5 } },

    // KEYBOARDS
    { id: 'kb_office', type: 'keyboard', name: 'Липкая мембранка', cost: 0, resaleValue: 0, description: 'Кнопки западают.', visualClass: 'bg-slate-300', effect: { type: 'click_power', value: 0 } },
    { id: 'kb_mech', type: 'keyboard', name: 'Mech Cherry MX', cost: 300, resaleValue: 150, description: 'ЩЕЛК ЩЕЛК ЩЕЛК.', visualClass: 'bg-slate-800 shadow-[0_0_5px_cyan]', effect: { type: 'click_power', value: 3 } },
    { id: 'kb_custom', type: 'keyboard', name: 'Custom Ergo Split', cost: 1200, resaleValue: 800, description: 'Эргономика 80 уровня.', visualClass: 'bg-transparent flex gap-4', effect: { type: 'bug_resist', value: 0.1 } },

    // MOUSE
    { id: 'mouse_office', type: 'mouse', name: 'Офисная мышь', cost: 0, resaleValue: 0, description: 'С шариком внутри.', visualClass: 'rounded-[2rem]', effect: { type: 'click_power', value: 0 } },
    { id: 'mouse_gamer', type: 'mouse', name: 'Razer Viper', cost: 150, resaleValue: 70, description: '20000 DPI.', visualClass: 'rounded-b-xl', effect: { type: 'click_power', value: 1 } },

    // MOUSEPADS
    { id: 'pad_basic', type: 'mousepad', name: 'Тряпочный коврик', cost: 0, resaleValue: 0, description: 'Впитывает кофе.', visualClass: 'bg-slate-600 rounded-lg', effect: { type: 'luck', value: 0 } },
    { id: 'pad_rgb', type: 'mousepad', name: 'RGB Surface', cost: 200, resaleValue: 100, description: 'Светится в темноте.', visualClass: 'bg-black border border-white shadow-[0_0_10px_purple] rounded-lg', effect: { type: 'click_power', value: 1 } },
    { id: 'pad_pro', type: 'mousepad', name: 'ESports Mat XXL', cost: 500, resaleValue: 250, description: 'На весь стол.', visualClass: 'bg-slate-800 border-b-2 border-red-500 w-[200%] h-[150%]', effect: { type: 'click_power', value: 2 } },

    // CPU
    { id: 'cpu_basic', type: 'cpu', name: 'Intel Celeron', cost: 0, resaleValue: 0, description: 'Медленный, но холодный.', visualClass: 'bg-slate-400', heatOutput: 5, effect: { type: 'heat', value: 5 } },
    { id: 'cpu_mid', type: 'cpu', name: 'AMD Ryzen 5', cost: 600, resaleValue: 300, description: 'Отличный баланс.', visualClass: 'bg-orange-500', heatOutput: 15, effect: { type: 'heat', value: 15 } },
    { id: 'cpu_high', type: 'cpu', name: 'Intel Core i9', cost: 2000, resaleValue: 1200, description: 'Требует водянку.', visualClass: 'bg-blue-600', heatOutput: 40, effect: { type: 'heat', value: 40 } },

    // DARKHUB EXCLUSIVES (SHADOW MARKET)
    {
        id: 'cpu_red_dragon',
        type: 'cpu',
        name: 'Red Dragon Proto-X',
        cost: 0,
        shadowCost: 5000,
        resaleValue: 8000,
        isIllegal: true,
        isStolen: true,
        traceSignature: 45,
        heatOutput: 200,
        description: '[MILTECH] Военный прототип. Скорость x5. Риск пожара.',
        visualClass: 'bg-red-900 border-2 border-red-500 animate-pulse shadow-[0_0_20px_red]',
        effect: { type: 'auto_code', value: 100 }
    },
    {
        id: 'gpu_miner_cluster',
        type: 'gpu',
        name: 'Silicon Triad Miner',
        cost: 0,
        shadowCost: 3500,
        resaleValue: 4000,
        isIllegal: true,
        traceSignature: 20,
        heatOutput: 150,
        description: '[TRIAD] Списанный майнер. Приносит пассивный доход.',
        visualClass: 'bg-yellow-600 border-2 border-yellow-400',
        effect: { type: 'heat', value: 150 }
    },
    {
        id: 'tool_flasher',
        type: 'decor',
        name: 'Hardware Flasher v2.0',
        cost: 0,
        shadowCost: 2000,
        resaleValue: 0,
        isIllegal: true,
        traceSignature: 15,
        heatOutput: 0,
        description: '[TOOL] Устройство для смены серийных номеров. Позволяет "отмывать" железо.',
        visualClass: 'bg-slate-800 border-2 border-red-500',
        effect: { type: 'luck', value: 0 }
    },
    {
        id: 'usb_exploit',
        type: 'decor',
        name: 'Zero-Day USB',
        cost: 0,
        shadowCost: 1000,
        resaleValue: 0,
        isIllegal: true,
        traceSignature: 10,
        heatOutput: 0,
        description: '[NULL_PTR] Снижает шанс багов до 0%.',
        visualClass: 'bg-black border border-green-500 animate-pulse',
        effect: { type: 'bug_resist', value: 1.0 }
    },

    // GPU
    { id: 'gpu_integrated', type: 'gpu', name: 'Integrated Graphics', cost: 0, resaleValue: 0, description: 'Холодная встройка.', visualClass: 'bg-slate-500', heatOutput: 2, effect: { type: 'heat', value: 2 } },
    { id: 'gpu_gtx', type: 'gpu', name: 'GTX 1060', cost: 400, resaleValue: 200, description: 'Греется умеренно.', visualClass: 'bg-green-700', heatOutput: 10, effect: { type: 'heat', value: 10 } },
    { id: 'gpu_rtx', type: 'gpu', name: 'RTX 4090', cost: 3500, resaleValue: 2000, description: 'Печка для комнаты.', visualClass: 'bg-green-400 shadow-[0_0_10px_lime]', heatOutput: 50, effect: { type: 'heat', value: 50 } },

    // COOLERS
    { id: 'cooler_stock', type: 'cooler', name: 'Stock Cooler', cost: 0, resaleValue: 0, description: 'Алюминиевый брусок.', visualClass: 'bg-slate-300 rounded-full', effect: { type: 'cooling', value: 10 } },
    { id: 'cooler_tower', type: 'cooler', name: 'Hyper 212', cost: 100, resaleValue: 50, description: 'Медная башня.', visualClass: 'bg-slate-200 border-x-4 border-orange-400', effect: { type: 'cooling', value: 30 } },
    { id: 'cooler_water', type: 'cooler', name: 'Kraken AIO Water', cost: 500, resaleValue: 250, description: 'Тишина и холод.', visualClass: 'bg-black border-4 border-blue-500 rounded-full animate-pulse', effect: { type: 'cooling', value: 80 } },
    { id: 'cooler_ln2', type: 'cooler', name: 'Liquid Nitrogen Pot', cost: 0, shadowCost: 2000, resaleValue: 1500, isIllegal: true, description: 'Жидкий азот. Только для экстремалов.', visualClass: 'bg-white border-4 border-blue-200 shadow-[0_0_20px_white]', effect: { type: 'cooling', value: 300 } },

    // RAM & STORAGE
    { id: 'ram_4gb', type: 'ram', name: '4GB DDR3', cost: 0, resaleValue: 0, description: 'Chrome смеется над тобой.', visualClass: 'bg-green-800', effect: { type: 'auto_code', value: 1 } },
    { id: 'ram_16gb', type: 'ram', name: '16GB DDR4', cost: 200, resaleValue: 100, description: 'Хватит для Docker.', visualClass: 'bg-green-600', effect: { type: 'auto_code', value: 5 } },
    { id: 'ram_64gb', type: 'ram', name: '64GB DDR5 RGB', cost: 800, resaleValue: 400, description: 'Светится и летает.', visualClass: 'bg-red-500 animate-pulse', effect: { type: 'auto_code', value: 15 } },

    { id: 'hdd_old', type: 'storage', name: 'HDD 500GB', cost: 0, resaleValue: 0, storageCap: 500, description: '500 GB. Трещит при работе.', visualClass: 'bg-slate-600', effect: { type: 'bug_resist', value: 0 } },
    { id: 'ssd_sata', type: 'storage', name: 'SSD SATA 1TB', cost: 150, resaleValue: 70, storageCap: 1000, description: '1 TB. Быстрая загрузка.', visualClass: 'bg-blue-500', effect: { type: 'bug_resist', value: 0.2 } },
    { id: 'ssd_nvme', type: 'storage', name: 'NVMe M.2 2TB', cost: 500, resaleValue: 250, storageCap: 2000, description: '2 TB. Скорость света.', visualClass: 'bg-black border border-green-500', effect: { type: 'bug_resist', value: 0.5 } },
    { id: 'ssd_portable', type: 'storage', name: 'USB Portable 4TB', cost: 300, resaleValue: 200, storageCap: 4000, description: '4 TB. Внешний диск для бэкапов.', visualClass: 'bg-orange-600 rounded-xl', effect: { type: 'bug_resist', value: 0.1 } },

    // INTERIOR
    { id: 'window_wall', type: 'window', name: 'Нет окна', cost: 0, resaleValue: 0, description: 'Депрессивно.', visualClass: 'bg-slate-800', effect: { type: 'comfort', value: 0 } },
    { id: 'window_city', type: 'window', name: 'Вид на город', cost: 800, resaleValue: 0, description: 'Вдохновляет.', visualClass: 'bg-[url("https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2613&auto=format&fit=crop")]', effect: { type: 'comfort', value: 10 } },
    { id: 'window_cyber', type: 'window', name: 'Cyber City View', cost: 2500, resaleValue: 0, description: 'Неоновый дождь.', visualClass: 'bg-[url("https://images.unsplash.com/photo-1555680202-c86f0e12f086?q=80&w=2070&auto=format&fit=crop")]', effect: { type: 'comfort', value: 25 } },

    { id: 'desk_wood', type: 'desk', name: 'Бабушкин стол', cost: 0, resaleValue: 0, description: 'Пахнет лаком.', visualClass: 'bg-[#5D4037]', effect: { type: 'comfort', value: 0 } },
    { id: 'desk_white', type: 'desk', name: 'IKEA White', cost: 200, resaleValue: 50, description: 'Минимализм.', visualClass: 'bg-slate-200', effect: { type: 'comfort', value: 5 } },
    { id: 'desk_glass', type: 'desk', name: 'Glass & RGB', cost: 1200, resaleValue: 400, description: 'Стеклянный хайтек.', visualClass: 'bg-blue-900/40 border-t border-blue-400 backdrop-blur', effect: { type: 'comfort', value: 15 } },

    { id: 'chair_stool', type: 'chair', name: 'Табуретка', cost: 0, resaleValue: 0, description: 'Спина выйдет из чата.', visualClass: 'bg-amber-800 w-32 h-32 rounded-full', effect: { type: 'comfort', value: -10 } },
    { id: 'chair_office', type: 'chair', name: 'Офисное кресло', cost: 300, resaleValue: 100, description: 'Нормально.', visualClass: 'bg-slate-700 w-48 h-64 rounded-t-xl', effect: { type: 'comfort', value: 10 } },
    { id: 'chair_gamer', type: 'chair', name: 'DXRacer RGB', cost: 900, resaleValue: 400, description: 'Дает +10 к скиллу.', visualClass: 'bg-black border-2 border-red-500 w-56 h-80 rounded-t-2xl shadow-[0_0_20px_red]', effect: { type: 'comfort', value: 25 } },

    { id: 'hp_none', type: 'headphones', name: 'Нет наушников', cost: 0, resaleValue: 0, description: '', visualClass: 'hidden', effect: { type: 'sound', value: 0 } },
    { id: 'hp_basic', type: 'headphones', name: 'Basic Headset', cost: 50, resaleValue: 10, description: '', visualClass: 'border-slate-800', effect: { type: 'sound', value: 1 } },
    { id: 'hp_pro', type: 'headphones', name: 'Studio Pro', cost: 400, resaleValue: 150, description: 'Слышно каждый бит.', visualClass: 'border-white shadow-[0_0_10px_white]', effect: { type: 'sound', value: 5 } },

    { id: 'sp_none', type: 'speakers', name: 'Нет колонок', cost: 0, resaleValue: 0, description: '', visualClass: 'hidden', effect: { type: 'sound', value: 0 } },
    { id: 'sp_monitor', type: 'speakers', name: 'Studio Monitors', cost: 600, resaleValue: 200, description: 'Чистый звук.', visualClass: 'bg-slate-800', effect: { type: 'sound', value: 5 } },

    { id: 'wall_paint_grey', type: 'wall', name: 'Обшарпанные стены', cost: 0, resaleValue: 0, description: 'Следы от скотча.', visualClass: 'bg-slate-900', effect: { type: 'luck', value: 0 } },
    { id: 'wall_brick', type: 'wall', name: 'Лофт Кирпич', cost: 1000, resaleValue: 0, description: 'Модный индастриал.', visualClass: 'bg-[url("https://www.transparenttextures.com/patterns/brick-wall.png")] bg-red-900/50 bg-blend-multiply', effect: { type: 'luck', value: 0.1 } },
    { id: 'wall_matrix', type: 'wall', name: 'Цифровой Шум', cost: 5000, resaleValue: 0, description: 'Стены двигаются...', visualClass: 'bg-black border-t-4 border-green-500', effect: { type: 'luck', value: 0.3 } },

    { id: 'poster_none', type: 'poster', name: 'Пустая стена', cost: 0, resaleValue: 0, description: '', visualClass: 'hidden', effect: { type: 'click_power', value: 0 } },
    { id: 'poster_ai', type: 'poster', name: 'Плакат "I Want to Believe"', cost: 200, resaleValue: 20, description: 'Классика.', visualClass: 'bg-green-900 border-2 border-white', effect: { type: 'click_power', value: 2 } },
    { id: 'poster_code', type: 'poster', name: 'Схема VIM', cost: 100, resaleValue: 10, description: 'Чтобы выйти, перезагрузи комнату.', visualClass: 'bg-slate-800 border border-slate-500', effect: { type: 'auto_code', value: 2 } },
];

export const INITIAL_GAME_STATE: GameState = {
    language: 'ru',
    username: 'Guest',
    money: 100,
    shadowCredits: 0,
    reputation: 0,
    linesOfCode: 0,
    bugs: 0,
    level: SkillLevel.INTERN,

    clickPower: 5,
    autoCodePerSecond: 0,
    bugChance: 0.15,

    energy: 100,
    timeOfDay: 8.0,
    day: 1,
    temperature: 30,

    globalHeat: 10,
    tracePercent: 0,
    marketTrends: {},

    signalEndTime: 0,
    shadowAccessExpiry: 0,

    // Bank
    bills: [],
    transactions: [],
    loanDebt: 0,
    creditScore: 500,

    // Living World
    news: [
        { id: 'news_start', headline: 'CyberTech Corp announces DevOS 3.0', content: 'The new OS promises direct neural interface capabilities. Critics warn of privacy risks.', category: 'TECH', impact: 'neutral', timestamp: Date.now() }
    ],
    emails: [
        { id: 'email_start', sender: 'System', subject: 'Welcome to your workspace', body: 'Your account has been created. Check the manual for instructions.', isRead: false, timestamp: Date.now(), type: 'system' }
    ],

    currentQuestIndex: 0,
    isShadowMarketUnlocked: false,

    activeProject: null,
    releasedProjects: [],
    userApps: [
        {
            id: 'app_sample_1',
            name: 'Bouncy Ball',
            domain: 'ball.ang',
            icon: '⚽',
            createdAt: Date.now(),
            code: `
<html>
<style>
  body { margin: 0; background: #111; overflow: hidden; display: flex; align-items: center; justify-content: center; height: 100vh; color: white; font-family: sans-serif; }
  #ball { width: 50px; height: 50px; background: red; border-radius: 50%; position: absolute; }
</style>
<body>
  <div id="ball"></div>
  <div style="position:absolute; top: 10px; left: 10px;">Click to jump!</div>
  <script>
    const ball = document.getElementById('ball');
    let x = 100, y = 100, dx = 3, dy = 3;
    
    function anim() {
      x += dx; y += dy;
      if(x + 50 > window.innerWidth || x < 0) dx = -dx;
      if(y + 50 > window.innerHeight || y < 0) dy = -dy;
      ball.style.left = x + 'px';
      ball.style.top = y + 'px';
      requestAnimationFrame(anim);
    }
    anim();
    document.addEventListener('click', () => { dy = -10; dx = (Math.random() - 0.5) * 10; });
  </script>
</body>
</html>`
        }
    ] as UserApp[],
    unlockedPerks: [],

    fileSystem: FILE_SYSTEM_INIT, // Init file system

    inventory: STARTER_INV,
    equipped: getStarterEquipped(STARTER_INV),
    hasUnreadMessages: true,
    isGameWon: false,

    // Notification & Achievement System
    notifications: [],
    unlockedAchievements: [],

    // LAYER 5/7/8: Player Role, Blueprints, Corporations
    playerRole: 'programmer',
    playerTier: 'trainee',
    blueprints: [],
    corporationReps: [
        // S-TIER (LAYER 28)
        { corporationId: 'ang_vers', reputation: 0, rank: 'нейтрал', totalContracts: 0, lastInteraction: Date.now() },
        // A-TIER
        { corporationId: 'titan', reputation: 0, rank: 'нейтрал', totalContracts: 0, lastInteraction: Date.now() },
        { corporationId: 'orbitron', reputation: 0, rank: 'нейтрал', totalContracts: 0, lastInteraction: Date.now() },
        // B-TIER
        { corporationId: 'novatek', reputation: 0, rank: 'нейтрал', totalContracts: 0, lastInteraction: Date.now() },
        { corporationId: 'cyberforge', reputation: 0, rank: 'нейтрал', totalContracts: 0, lastInteraction: Date.now() },
        // C-TIER (Shadow)
        { corporationId: 'blacksun', reputation: 0, rank: 'нейтрал', totalContracts: 0, lastInteraction: Date.now() }
    ],
    serverRegion: 'EU-West', // Default region

    // LAYER 5+: Corporation Membership & Social
    corpMembership: undefined,
    activeCorpQuests: [],
    completedCorpQuests: [],

    // LAYER 28: ANG Vers Social State (initialized on first login)
    angVersState: undefined
};

export const CODE_SNIPPETS: Record<ProgrammingLanguage, string[]> = {
    javascript: [
        "const a = 10; // Simple assignment",
        "function init() { console.log('Starting...'); }",
        "const AI = new NeuralNet();",
        "while(alive) { code(); }",
        "git commit -m 'Fixed bugs'"
    ],
    python: [
        "def main():\n    print('Hello')",
        "import numpy as np",
        "if __name__ == '__main__':"
    ],
    cpp: ["int main() { return 0; }"],
    rust: ["fn main() { println!(\"Hello\"); }"],
    go: ["func main() { fmt.Println(\"Hello\") }"],
    sql: ["SELECT * FROM users;"],
    lua: ["print('Hello World')"]
};

export const LEARNING_QUESTS: Quest[] = [
    {
        id: 0,
        title: "Hello World",
        description: "Write your first script.",
        story: "Every hacker starts here.",
        task: "Type a console log command.",
        solutionRegex: /console\.log/,
        rewardMoney: 100,
        rewardExp: 50,
        hint: "console.log('text')",
        explanation: "Basic output."
    },
    {
        id: 1,
        title: "Variables",
        description: "Variables",
        story: "Memory",
        task: "Assign",
        solutionRegex: /var|let|const/,
        rewardMoney: 20,
        rewardExp: 20,
        hint: "let x = 1",
        explanation: "Vars"
    },
    {
        id: 2,
        title: "The Gate",
        description: "Hack DarkHub",
        story: "Breach",
        task: "connect 192.168.0.666",
        solutionRegex: /connect\s+192\.168\.0\.666/,
        rewardMoney: 0,
        rewardExp: 100,
        hint: "connect IP",
        explanation: "Hacking"
    }
];

export const SKILL_TREE: SkillPerk[] = [
    {
        id: 'perk_coffee',
        name: 'Coffee Lover',
        cost: 100,
        description: 'Energy drains slower.',
        icon: '☕',
        effect: { type: 'energy_save', value: 0.2 }
    },
    {
        id: 'perk_miner',
        name: 'Crypto Miner',
        cost: 500,
        description: 'Passive income from GPU.',
        icon: '⛏️',
        effect: { type: 'passive_income', value: 0.5 }
    }
];

export const ACHIEVEMENTS = [
    {
        id: 'ach_first_code',
        title: 'Hello World',
        description: 'Написать первые 100 строк кода',
        icon: '👨‍💻',
        category: 'coding' as const,
        condition: (state: any) => state.linesOfCode >= 100,
        reward: { reputation: 10 }
    },
    {
        id: 'ach_code_master',
        title: 'Code Master',
        description: 'Написать 10,000 строк кода',
        icon: '🎯',
        category: 'coding' as const,
        condition: (state: any) => state.linesOfCode >= 10000,
        reward: { reputation: 100, money: 500 }
    },
    {
        id: 'ach_first_million',
        title: 'Первый миллион',
        description: 'Накопить $1,000,000',
        icon: '💰',
        category: 'economy' as const,
        condition: (state: any) => state.money >= 1000000,
        reward: { reputation: 200 }
    },
    {
        id: 'ach_pc_builder',
        title: 'Сборщик ПК',
        description: 'Установить топовое железо (RTX 4090 + i9)',
        icon: '🖥️',
        category: 'hardware' as const,
        condition: (state: any) => {
            const hasRTX = state.inventory.some((i: any) => i.itemId === 'gpu_rtx');
            const hasI9 = state.inventory.some((i: any) => i.itemId === 'cpu_high');
            return hasRTX && hasI9;
        },
        reward: { reputation: 50 }
    },
    {
        id: 'ach_hacker',
        title: 'Хакер',
        description: 'Взломать DarkHub',
        icon: '🔓',
        category: 'hacking' as const,
        condition: (state: any) => state.isShadowMarketUnlocked,
        reward: { shadowCredits: 500, reputation: 100 }
    },
    {
        id: 'ach_shadow_trader',
        title: 'Теневой Торговец',
        description: 'Купить что-то на DarkHub',
        icon: '🕵️',
        category: 'hacking' as const,
        condition: (state: any) => {
            return state.inventory.some((i: any) => {
                const item = HARDWARE_CATALOG.find(h => h.id === i.itemId);
                return item?.isIllegal;
            });
        },
        reward: { shadowCredits: 200 }
    },
    {
        id: 'ach_project_release',
        title: 'Релиз',
        description: 'Выпустить первый проект',
        icon: '🚀',
        category: 'coding' as const,
        condition: (state: any) => state.releasedProjects && state.releasedProjects.length > 0,
        reward: { money: 1000, reputation: 50 }
    },
    {
        id: 'ach_entrepreneur',
        title: 'Предприниматель',
        description: 'Выпустить 5 проектов',
        icon: '📈',
        category: 'economy' as const,
        condition: (state: any) => state.releasedProjects && state.releasedProjects.length >= 5,
        reward: { money: 5000, reputation: 150 }
    },
    {
        id: 'ach_overheating',
        title: 'Пожарная Тревога',
        description: 'Перегреть систему до 95°C',
        icon: '🔥',
        category: 'hardware' as const,
        condition: (state: any) => state.temperature >= 95,
        reward: { reputation: 25 }
    },
    {
        id: 'ach_debt_free',
        title: 'Без Долгов',
        description: 'Погасить все кредиты',
        icon: '💳',
        category: 'economy' as const,
        condition: (state: any) => state.loanDebt === 0 && state.money > 0,
        reward: { reputation: 100 }
    },
    {
        id: 'ach_night_owl',
        title: 'Ночная Сова',
        description: 'Работать в 3 часа ночи',
        icon: '🦉',
        category: 'story' as const,
        condition: (state: any) => state.timeOfDay >= 3 && state.timeOfDay <= 4,
        reward: { reputation: 10 }
    },
    {
        id: 'ach_bug_hunter',
        title: 'Охотник за Багами',
        description: 'Исправить 100 багов',
        icon: '🐛',
        category: 'coding' as const,
        condition: (state: any) => state.bugs <= 0 && state.linesOfCode >= 1000,
        reward: { reputation: 75 }
    },
    {
        id: 'ach_singularity',
        title: 'Сингулярность',
        description: 'Достичь финала игры',
        icon: '🌟',
        category: 'story' as const,
        condition: (state: any) => state.isGameWon,
        reward: { reputation: 1000 },
        hidden: true
    }
];

export const TRANSLATIONS: Record<Language, any> = {
    ru: {
        system_ready: "СИСТЕМА ГОТОВА",
        enter_pc: "Войти в систему",
        offline: "ОФФЛАЙН",
        clean: "Очистить",
        editor: "РЕДАКТОР",
        builder: "КОНСТРУКТОР",
        manual: "СПРАВКА",
        install: "Установить",
        sleep: "Спать",
        start_menu_logout: "Выйти из системы",
        start_menu_reboot: "Перезагрузка"
    },
    en: {
        system_ready: "SYSTEM READY",
        enter_pc: "Enter System",
        offline: "OFFLINE",
        clean: "Clean",
        editor: "EDITOR",
        builder: "BUILDER",
        manual: "MANUAL",
        install: "Install",
        sleep: "Sleep",
        start_menu_logout: "Logout",
        start_menu_reboot: "Reboot"
    },
    uk: {
        system_ready: "СИСТЕМА ГОТОВА",
        enter_pc: "Увійти в систему",
        offline: "ОФЛАЙН",
        clean: "Очистити",
        editor: "РЕДАКТОР",
        builder: "КОНСТРУКТОР",
        manual: "ДОВІДКА",
        install: "Встановити",
        sleep: "Спати",
        start_menu_logout: "Вийти",
        start_menu_reboot: "Перезавантаження"
    }
};

export const LORE_LIBRARY: Record<Language, any> = {
    ru: {
        intro: { 
            title: "🎮 Добро пожаловать в DevStudio!", 
            content: [
                "╔══════════════════════════════════════════════════════════════╗",
                "║  DevStudio Pro v3.0 — Ваша IDE для покорения мира DevOS!    ║",
                "╚══════════════════════════════════════════════════════════════╝",
                "",
                "DevStudio — это ГЛАВНЫЙ инструмент разработчика в игре DevTycoon.",
                "Здесь вы пишете код, создаёте сайты и приложения, строите логику визуально!",
                "",
                "🔹 ТРИ РЕЖИМА РАБОТЫ:",
                "",
                "┌─────────────┬──────────────────────────────────────────────┐",
                "│ EDITOR 📝   │ Текстовый редактор с подсветкой синтаксиса  │",
                "├─────────────┼──────────────────────────────────────────────┤",
                "│ BUILDER 🛠️  │ Визуальный редактор + конструктор сайтов    │",
                "├─────────────┼──────────────────────────────────────────────┤",
                "│ MANUAL 📘   │ Документация и туториалы (вы здесь!)        │",
                "└─────────────┴──────────────────────────────────────────────┘",
                "",
                "💡 СОВЕТ: Переключайтесь между режимами кнопками вверху окна!",
                "",
                "🎯 ЗАЧЕМ ВАМ DevStudio?",
                "- Писать код для проектов и зарабатывать деньги",
                "- Создавать сайты и приложения для установки",
                "- Строить логику визуально без кода (для новичков!)",
                "- Управлять файлами через встроенный проводник"
            ] 
        },
        tutorial: { 
            title: "📚 Туториал — Первые шаги", 
            content: [
                "╔══════════════════════════════════════════════════════════════╗",
                "║           🎓 ОБУЧЕНИЕ DEVSTUDIO — 5 УРОКОВ                   ║",
                "╚══════════════════════════════════════════════════════════════╝",
                "",
                "═══════════════════════════════════════════════════════════════",
                "УРОК 1: СОЗДАНИЕ ПЕРВОГО ФАЙЛА",
                "═══════════════════════════════════════════════════════════════",
                "1. Перейдите в режим EDITOR (кнопка вверху)",
                "2. В левой панели нажмите ➕ рядом с 'Files'",
                "3. Введите имя файла: hello.js",
                "4. Напишите код:",
                "",
                "+------------------------------------------+",
                "|  console.log('Привет, DevOS!');         |",
                "+------------------------------------------+",
                "",
                "5. Файл автоматически сохранится в DevFS!",
                "",
                "═══════════════════════════════════════════════════════════════",
                "УРОК 2: VISUAL EDITOR — ПРОГРАММИРОВАНИЕ БЕЗ КОДА",
                "═══════════════════════════════════════════════════════════════",
                "1. Перейдите в BUILDER → VISUAL",
                "2. Нажмите кнопку [+ EVENT] внизу",
                "3. Выберите 'onClick' — это триггер клика",
                "4. Нажмите [+ ACTION] и выберите 'alert'",
                "5. Соедините блоки: тяните от ● до ○",
                "",
                "Визуально это выглядит так:",
                "+─────────────+          +─────────────+",
                "│   EVENT     │          │   ACTION    │",
                "│  onClick    │───────▶  │   alert     │",
                "│      ●      │          │  'Hello!'   │",
                "+─────────────+          +─────────────+",
                "",
                "6. Нажмите COMPILE — код сгенерируется автоматически!",
                "",
                "═══════════════════════════════════════════════════════════════",
                "УРОК 3: СОЗДАНИЕ САЙТА",
                "═══════════════════════════════════════════════════════════════",
                "1. В BUILDER → CODE напишите HTML:",
                "",
                "+------------------------------------------+",
                "|  <html>                                  |",
                "|    <body style='background: #1a1a2e'>   |",
                "|      <h1 style='color: cyan'>           |",
                "|        Мой первый сайт!                 |",
                "|      </h1>                              |",
                "|    </body>                              |",
                "|  </html>                                |",
                "+------------------------------------------+",
                "",
                "2. Заполните поля: Название, Иконка, Домен",
                "3. Нажмите INSTALL — сайт появится на рабочем столе!",
                "",
                "═══════════════════════════════════════════════════════════════",
                "УРОК 4: РАБОТА С ПРОЕКТАМИ",
                "═══════════════════════════════════════════════════════════════",
                "1. Откройте Projects App (🚀)",
                "2. Выберите шаблон проекта",
                "3. Кликайте для прогресса или пишите код",
                "4. При 100% нажмите 'Выпустить'",
                "5. Проект начнёт приносить пассивный доход!",
                "",
                "═══════════════════════════════════════════════════════════════",
                "УРОК 5: УСТАНОВКА И УДАЛЕНИЕ ПРИЛОЖЕНИЙ",
                "═══════════════════════════════════════════════════════════════",
                "Созданные приложения появляются на рабочем столе.",
                "",
                "УДАЛЕНИЕ:",
                "1. Правый клик на иконку приложения",
                "2. Выберите '🗑️ Uninstall'",
                "3. Приложение удалено!",
                "",
                "⚠️ ВНИМАНИЕ: Системные приложения (DevStudio, Browser и др.) удалить нельзя!"
            ] 
        },
        editor: { 
            title: "📝 Режим EDITOR — Редактор кода", 
            content: [
                "╔══════════════════════════════════════════════════════════════╗",
                "║         ТЕКСТОВЫЙ РЕДАКТОР С ПОДСВЕТКОЙ СИНТАКСИСА          ║",
                "╚══════════════════════════════════════════════════════════════╝",
                "",
                "Режим EDITOR — это классическая IDE для написания кода.",
                "",
                "🎨 ПОДСВЕТКА СИНТАКСИСА:",
                "Автоматически определяется по расширению файла.",
                "",
                "┌────────────┬────────────┬─────────────────────────────┐",
                "│ Язык       │ Расширение │ Цвета                       │",
                "├────────────┼────────────┼─────────────────────────────┤",
                "│ JavaScript │ .js        │ 🟡 жёлтый/оранжевый         │",
                "│ TypeScript │ .ts        │ 🔵 синий                    │",
                "│ Python     │ .py        │ 🟢 зелёный                  │",
                "│ HTML       │ .html      │ 🔴 красный                  │",
                "│ CSS        │ .css       │ 🟣 фиолетовый               │",
                "│ JSON       │ .json      │ 🟡 жёлтый                   │",
                "│ SQL        │ .sql       │ 🔵 синий                    │",
                "└────────────┴────────────┴─────────────────────────────┘",
                "",
                "📁 ПРОВОДНИК ФАЙЛОВ (слева):",
                "- Клик на файл → открыть",
                "- ➕ создать файл/папку",
                "- Правый клик → контекстное меню",
                "",
                "💾 АВТОСОХРАНЕНИЕ:",
                "Все изменения сохраняются в DevFS автоматически каждую секунду!",
                "",
                "🔍 ПОИСК ПО ФАЙЛАМ:",
                "Используйте поле поиска для нахождения кода в проекте."
            ] 
        },
        builder: { 
            title: "🛠️ Режим BUILDER — Конструктор", 
            content: [
                "╔══════════════════════════════════════════════════════════════╗",
                "║      ВИЗУАЛЬНЫЙ РЕДАКТОР + КОНСТРУКТОР САЙТОВ               ║",
                "╚══════════════════════════════════════════════════════════════╝",
                "",
                "BUILDER имеет два подрежима:",
                "",
                "═══════════════════════════════════════════════════════════════",
                "📝 CODE — Редактор HTML/CSS/JS",
                "═══════════════════════════════════════════════════════════════",
                "Пишите код сайта напрямую:",
                "",
                "+------------------------------------------+",
                "|  <html>                                  |",
                "|    <head>                                |",
                "|      <style>                             |",
                "|        body { background: #0a0a0a; }     |",
                "|        h1 { color: #00ff88; }            |",
                "|      </style>                            |",
                "|    </head>                               |",
                "|    <body>                                |",
                "|      <h1>Мой CyberSite</h1>              |",
                "|    </body>                               |",
                "|  </html>                                 |",
                "+------------------------------------------+",
                "",
                "После написания кода заполните:",
                "- 📦 Название приложения",
                "- 🎨 Иконка (эмодзи)",
                "- 🌐 Домен (например: mysite)",
                "",
                "Нажмите INSTALL — сайт появится на рабочем столе!",
                "",
                "═══════════════════════════════════════════════════════════════",
                "🧩 VISUAL — Блочный редактор логики",
                "═══════════════════════════════════════════════════════════════",
                "Программируйте визуально, как в Scratch!",
                "",
                "ТИПЫ БЛОКОВ:",
                "",
                "┌──────────────┬─────────────────────────────────────────────┐",
                "│ [EVENT] 🟢   │ Триггеры: onClick, onLoad, onTimer         │",
                "├──────────────┼─────────────────────────────────────────────┤",
                "│ [ACTION] 🔵  │ Действия: alert, log, navigate, setValue   │",
                "├──────────────┼─────────────────────────────────────────────┤",
                "│ [LOGIC] 🟣   │ Условия: if, else, loop, switch            │",
                "├──────────────┼─────────────────────────────────────────────┤",
                "│ [VAR] 🟡     │ Переменные: set, get, compute              │",
                "└──────────────┴─────────────────────────────────────────────┘",
                "",
                "ПРИМЕР ГРАФА:",
                "",
                "  [EVENT]           [LOGIC]            [ACTION]",
                "  onLoad  ────────▶  if x > 0  ───────▶  alert",
                "     │                  │                  │",
                "     │                  └──────▶  [ACTION] log",
                "     │",
                "     └────────────────▶  [ACTION] setValue",
                "",
                "COMPILE: Превращает граф в JavaScript код!",
                "RUN: Запускает скомпилированный код!"
            ] 
        },
        devfs: { 
            title: "💾 DevFS — Файловая система", 
            content: [
                "╔══════════════════════════════════════════════════════════════╗",
                "║           ВИРТУАЛЬНАЯ ФАЙЛОВАЯ СИСТЕМА DeVOS                ║",
                "╚══════════════════════════════════════════════════════════════╝",
                "",
                "DevFS — это ваш виртуальный жёсткий диск в игре!",
                "Все файлы хранятся в IndexedDB браузера.",
                "",
                "📂 СТРУКТУРА ПАПОК:",
                "",
                "/",
                "├── 📁 projects/      ← Ваши проекты",
                "│   ├── project_001/",
                "│   │   ├── meta.json",
                "│   │   └── code.js",
                "│   └── project_002/",
                "│",
                "├── 📁 sites/         ← Созданные сайты",
                "│   └── mysite/",
                "│       └── index.html",
                "│",
                "├── 📁 storage/       ← Пользовательские файлы",
                "│",
                "└── 📁 apps/          ← Установленные приложения",
                "",
                "🔧 ВОЗМОЖНОСТИ:",
                "- Создание файлов и папок",
                "- Редактирование с автосохранением",
                "- Копирование и перемещение",
                "- История версий — откат изменений",
                "- Поиск по содержимому",
                "",
                "📱 ПРИЛОЖЕНИЯ ДЛЯ РАБОТЫ С DevFS:",
                "- 💾 DevFS — основной файловый браузер",
                "- 🗄️ Storage — расширенный менеджер",
                "- 💻 DevStudio — IDE с интеграцией"
            ] 
        },
        projects: { 
            title: "🚀 Проекты — Создание и выпуск", 
            content: [
                "╔══════════════════════════════════════════════════════════════╗",
                "║          СИСТЕМА ПРОЕКТОВ — ЯДРО ВАШЕЙ КАРЬЕРЫ              ║",
                "╚══════════════════════════════════════════════════════════════╝",
                "",
                "Проекты — это главный способ заработка в DevTycoon!",
                "",
                "🔄 ЖИЗНЕННЫЙ ЦИКЛ ПРОЕКТА:",
                "",
                "  [1. Выбор]  ──▶  [2. Разработка]  ──▶  [3. Выпуск]  ──▶  [4. Доход]",
                "      │                  │                   │                │",
                "   Шаблон            Код/Клики           Release!         Пассив $",
                "",
                "📊 ТИПЫ ПРОЕКТОВ:",
                "",
                "┌──────────┬───────────┬─────────────┬──────────────────┐",
                "│ Тип      │ Сложность │ Доход       │ Требуется уровень│",
                "├──────────┼───────────┼─────────────┼──────────────────┤",
                "│ 🌐 Web   │ 1-3       │ $10-500     │ Стажёр+          │",
                "│ 📱 App   │ 2-5       │ $50-2K      │ Junior+          │",
                "│ 🎮 Game  │ 3-7       │ $200-10K    │ Middle+          │",
                "│ 🤖 AI    │ 5-10      │ $1K-50K     │ Senior/CTO       │",
                "└──────────┴───────────┴─────────────┴──────────────────┘",
                "",
                "💰 ИСТОЧНИКИ ДОХОДА:",
                "- Пассивный доход от выпущенных проектов",
                "- Реклама в приложениях",
                "- Множители от шардов и корпораций",
                "",
                "🗑️ УДАЛЕНИЕ ПРОЕКТА:",
                "Можно удалить выпущенный проект через Projects App."
            ] 
        },
        skills: { 
            title: "🧠 Навыки и Прокачка", 
            content: [
                "╔══════════════════════════════════════════════════════════════╗",
                "║              СИСТЕМА РАЗВИТИЯ РАЗРАБОТЧИКА                  ║",
                "╚══════════════════════════════════════════════════════════════╝",
                "",
                "🎖️ УРОВНИ КАРЬЕРЫ:",
                "",
                "  🔰 Стажёр ──▶ 💚 Junior ──▶ 💙 Middle ──▶ 💜 Senior",
                "                                              │",
                "                                              ▼",
                "                              👑 CTO ◀── ⚡ Architect ◀── 🧠 Lead",
                "",
                "📈 КАК ПОЛУЧИТЬ XP:",
                "- Завершение проектов",
                "- Выполнение квестов корпораций",
                "- P2P контракты",
                "- Ежедневные задания",
                "",
                "🌳 ВЕТКИ НАВЫКОВ:",
                "",
                "┌──────────────┬──────────────────────────────────────────┐",
                "│ 💻 Coding    │ +скорость кода, -время на проекты        │",
                "├──────────────┼──────────────────────────────────────────┤",
                "│ 🎨 Design    │ +качество UI/UX, +доход от сайтов        │",
                "├──────────────┼──────────────────────────────────────────┤",
                "│ 🔒 Security  │ +защита от взломов, доступ к хакингу     │",
                "├──────────────┼──────────────────────────────────────────┤",
                "│ 💼 Business  │ +доходы, -стоимость покупок              │",
                "└──────────────┴──────────────────────────────────────────┘",
                "",
                "⬆️ ПОВЫШЕНИЕ:",
                "Автоматически при достижении порога репутации!"
            ] 
        },
        corporations: { 
            title: "🏢 Корпорации и Социум", 
            content: [
                "╔══════════════════════════════════════════════════════════════╗",
                "║             КОРПОРАТИВНАЯ СИСТЕМА DeVOS                     ║",
                "╚══════════════════════════════════════════════════════════════╝",
                "",
                "Вступите в корпорацию для доступа к эксклюзивным возможностям!",
                "",
                "🏆 TIER-СИСТЕМА КОРПОРАЦИЙ:",
                "",
                "  S-Tier ⭐⭐⭐⭐⭐  │  ANG Vers — элитная корпорация",
                "  A-Tier ⭐⭐⭐⭐    │  NexGen, CyberCore",
                "  B-Tier ⭐⭐⭐      │  DataFlow, CloudNine",
                "  C-Tier ⭐⭐        │  StartupHub",
                "",
                "📊 РАНГИ В КОРПОРАЦИИ:",
                "",
                "  recruit ──▶ member ──▶ specialist ──▶ manager ──▶ director ──▶ executive",
                "",
                "🎁 ВОЗМОЖНОСТИ:",
                "- Корпоративные квесты с наградами",
                "- Лаборатории с AI Cores",
                "- Корпоративные войны",
                "- Доступ к редким чертежам",
                "- Альянсы между корпорациями",
                "",
                "👥 SOCIAL HUB:",
                "- P2P контракты между игроками",
                "- Независимые гильдии",
                "- Менторство и обучение"
            ] 
        },
        hardware: { 
            title: "🔧 Железо и Чертежи", 
            content: [
                "╔══════════════════════════════════════════════════════════════╗",
                "║              СИСТЕМА АПГРЕЙДА КОМПЬЮТЕРА                    ║",
                "╚══════════════════════════════════════════════════════════════╝",
                "",
                "Улучшайте свой ПК для ускорения разработки!",
                "",
                "🖥️ ТИПЫ КОМПОНЕНТОВ:",
                "",
                "┌──────────┬─────────────────────────────────────────────┐",
                "│ 🔲 CPU   │ Скорость вычислений, компиляция            │",
                "│ 🎮 GPU   │ Графика, AI-вычисления, рендеринг          │",
                "│ 💾 RAM   │ Многозадачность, размер проектов           │",
                "│ 💽 SSD   │ Скорость загрузки, DevFS операции          │",
                "│ ❄️ Cooler│ Охлаждение, стабильность                   │",
                "│ 📦 Case  │ Корпус, эстетика                           │",
                "└──────────┴─────────────────────────────────────────────┘",
                "",
                "📜 ЧЕРТЕЖИ (Blueprints):",
                "",
                "  [Получить]  ──▶  [Крафт]  ──▶  [Установить]",
                "      │              │              │",
                "  Квесты/Корп    Materials      PCInternals",
                "",
                "⭐ ТИРЫ ЧЕРТЕЖЕЙ:",
                "T1-T2: Обычные компоненты",
                "T3-T4: Продвинутые",
                "T5: Легендарные",
                "T6: Quantum-уровень"
            ] 
        },
        hotkeys: { 
            title: "⌨️ Горячие клавиши", 
            content: [
                "╔══════════════════════════════════════════════════════════════╗",
                "║                    ГОРЯЧИЕ КЛАВИШИ DevOS                    ║",
                "╚══════════════════════════════════════════════════════════════╝",
                "",
                "🖥️ РАБОЧИЙ СТОЛ:",
                "",
                "┌──────────────────┬──────────────────────────────────────────┐",
                "│ Правый клик      │ Контекстное меню                         │",
                "│ Двойной клик     │ Открыть приложение/папку                 │",
                "│ Перетаскивание   │ Переместить иконку                       │",
                "└──────────────────┴──────────────────────────────────────────┘",
                "",
                "📝 РЕДАКТОР КОДА:",
                "",
                "┌──────────────────┬──────────────────────────────────────────┐",
                "│ Ctrl + S         │ Сохранить (автосохранение включено)      │",
                "│ Ctrl + Z         │ Отменить                                 │",
                "│ Ctrl + F         │ Поиск                                    │",
                "└──────────────────┴──────────────────────────────────────────┘",
                "",
                "🧩 VISUAL EDITOR:",
                "",
                "┌──────────────────┬──────────────────────────────────────────┐",
                "│ Клик на блок     │ Выбрать / редактировать параметры        │",
                "│ Перетаскивание   │ Переместить блок                         │",
                "│ ● ──▶ ○          │ Соединить блоки                          │",
                "│ Del / Backspace  │ Удалить выбранный блок                   │",
                "└──────────────────┴──────────────────────────────────────────┘"
            ] 
        }
    },
    en: {
        intro: { 
            title: "🎮 Welcome to DevStudio!", 
            content: [
                "DevStudio Pro v3.0 — Your IDE for conquering DeVOS!",
                "",
                "THREE WORK MODES:",
                "- EDITOR — Text editor with syntax highlighting",
                "- BUILDER — Visual editor + site constructor",
                "- MANUAL — Documentation and tutorials (you are here!)"
            ] 
        },
        tutorial: { title: "📚 Tutorial", content: ["Step-by-step guide to using DevStudio."] },
        editor: { title: "📝 Editor Mode", content: ["Text editor with syntax highlighting for 7 languages."] },
        builder: { title: "🛠️ Builder Mode", content: ["Visual logic editor + HTML/CSS/JS site builder."] },
        devfs: { title: "💾 DevFS", content: ["Virtual file system stored in IndexedDB."] },
        projects: { title: "🚀 Projects", content: ["Create, develop and release projects for income."] },
        skills: { title: "🧠 Skills", content: ["Level up your developer through the skill tree."] },
        corporations: { title: "🏢 Corporations", content: ["Join corporations for exclusive features."] },
        hardware: { title: "🔧 Hardware", content: ["Upgrade your PC with blueprints and components."] },
        hotkeys: { title: "⌨️ Hotkeys", content: ["Keyboard shortcuts for DevOS."] }
    },
    uk: {
        intro: { 
            title: "🎮 Ласкаво просимо до DevStudio!", 
            content: [
                "DevStudio Pro v3.0 — Ваша IDE для підкорення DeVOS!",
                "",
                "ТРИ РЕЖИМИ РОБОТИ:",
                "- EDITOR — Текстовий редактор",
                "- BUILDER — Візуальний редактор",
                "- MANUAL — Документація (ви тут!)"
            ] 
        },
        tutorial: { title: "📚 Туторіал", content: ["Покроковий посібник."] },
        editor: { title: "📝 Редактор", content: ["Текстовий редактор з підсвіткою синтаксису."] },
        builder: { title: "🛠️ Конструктор", content: ["Візуальний редактор логіки."] },
        devfs: { title: "💾 DevFS", content: ["Віртуальна файлова система."] },
        projects: { title: "🚀 Проекти", content: ["Створюйте та випускайте проекти."] },
        skills: { title: "🧠 Навички", content: ["Прокачуйте розробника."] },
        corporations: { title: "🏢 Корпорації", content: ["Вступайте в корпорації."] },
        hardware: { title: "🔧 Залізо", content: ["Покращуйте ПК."] },
        hotkeys: { title: "⌨️ Гарячі клавіші", content: ["Швидкі клавіші DeVOS."] }
    }
};

export const INITIAL_MESSAGES: Message[] = [
    {
        id: 'msg_1',
        sender: 'Mom',
        text: 'Hello!',
        avatar: '👩',
        timestamp: Date.now(),
        isRead: false
    }
];

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
    {
        id: 'proj_web',
        name: 'Simple Website',
        type: 'web',
        minLevel: SkillLevel.INTERN,
        difficulty: 1,
        linesNeeded: 100,
        baseRevenue: 10
    },
    {
        id: 'proj_agi',
        name: 'Project Singularity (AGI)',
        type: 'ai',
        minLevel: SkillLevel.CTO,
        difficulty: 100,
        linesNeeded: 5000,
        baseRevenue: 50000
    }
];

export const RADIO_STATIONS = [
    { name: "Lofi", url: "https://stream.zeno.fm/0r0xa792kwzuv" }
];