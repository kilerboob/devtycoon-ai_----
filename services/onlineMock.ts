
import { ChatMessage } from "../types";

const BOT_NAMES = ["Neo", "Trinity", "CyberPunk99", "NullPtr", "ScriptKiddie", "WhiteHat", "Satoshi", "DaVinci", "Glitch", "RootUser"];
const CHAT_PHRASES = [
    "Кто-нибудь знает, как пропатчить KDE под FreeBSD?",
    "Продам гараж в метавселенной. Дорого.",
    "Какой язык лучше: Rust или C++? (Только срач, пожалуйста)",
    "У меня опять сервер упал из-за дурацкого семиколона.",
    "Кто идет в рейд на базу данных корпорации?",
    "Куплю 3090ti, можно б/у после майнинга.",
    "В DarkHub завезли новые процы, говорят они плавят материнки.",
    "CyberBay глючит, не могу выставить лот.",
    "Ребята, скиньте сниппет для взлома тостера.",
    "Lofi hip hop radio - beats to relax/study to... залип на 5 часов."
];

const TRADE_PHRASES = [
    "WTS: RTX 3080, Mint condition. DM me.",
    "WTB: Server Rack parts. High price.",
    "Selling custom scripts for automating income.",
    "Anyone selling cooling liquid? My rig is burning.",
    "Trading rare NFT for GPU."
];

const SHADOW_PHRASES = [
    "Свежий дамп базы данных Bank of America. В ЛС.",
    "Нужен эксплойт нулевого дня для Chrome.",
    "Кто может отмыть крипту?",
    "Продам доступ к спутникам.",
    "Осторожно, федералы в общем чате."
];

class OnlineMockService {
    private intervalId: any;
    private onMessageCallback: ((msg: ChatMessage) => void) | null = null;
    private listeners = 0;

    start(callback: (msg: ChatMessage) => void) {
        this.onMessageCallback = callback;
        if (this.intervalId) return;

        // Simulate activity every 2-8 seconds
        this.intervalId = setInterval(() => {
            this.generateRandomMessage();
        }, 4000);
    }

    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    private generateRandomMessage() {
        if (!this.onMessageCallback) return;

        const r = Math.random();
        let channel: 'general' | 'trade' | 'shadow_net' = 'general';
        let text = CHAT_PHRASES[Math.floor(Math.random() * CHAT_PHRASES.length)];

        if (r > 0.7 && r < 0.9) {
            channel = 'trade';
            text = TRADE_PHRASES[Math.floor(Math.random() * TRADE_PHRASES.length)];
        } else if (r >= 0.9) {
            channel = 'shadow_net';
            text = SHADOW_PHRASES[Math.floor(Math.random() * SHADOW_PHRASES.length)];
        }

        const msg: ChatMessage = {
            id: Math.random().toString(36).substr(2, 9),
            sender: BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)],
            text: text,
            channel: channel,
            timestamp: Date.now(),
            isSystem: false
        };

        this.onMessageCallback(msg);
    }
}

export const onlineService = new OnlineMockService();
