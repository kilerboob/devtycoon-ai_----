/**
 * TutorialGuide - Interactive Guide/Tutorial System
 * Путеводитель по всем функциям игры с описанием
 */

import React, { useState } from 'react';
import { Language } from '../types';
import { TRANSLATIONS } from '../constants';

interface TutorialGuideProps {
  language: Language;
  onClose?: () => void;
  onHighlightApp?: (appId: string) => void;
}

type CategoryId = 'getting-started' | 'coding' | 'projects' | 'economy' | 'corporations' | 'blueprints' | 'skills' | 'hacking' | 'social' | 'advanced';

interface GuideSection {
  id: string;
  title: string;
  icon: string;
  description: string;
  tips?: string[];
  relatedApp?: string;
}

interface GuideCategory {
  id: CategoryId;
  title: string;
  icon: string;
  color: string;
  sections: GuideSection[];
}

// ============================================
// GUIDE CONTENT
// ============================================
const GUIDE_CONTENT: Record<Language, GuideCategory[]> = {
  ru: [
    {
      id: 'getting-started',
      title: 'Начало игры',
      icon: '🚀',
      color: '#22C55E',
      sections: [
        {
          id: 'welcome',
          title: 'Добро пожаловать в DevTycoon!',
          icon: '👋',
          description: 'Вы - начинающий разработчик в мире CyberNation. Ваша цель - стать легендарным программистом, построить империю и раскрыть тайны корпораций.',
          tips: [
            'Начните с простых заданий в IDE',
            'Копите деньги на улучшение ПК',
            'Изучайте навыки в дереве навыков'
          ]
        },
        {
          id: 'interface',
          title: 'Интерфейс DeVOS',
          icon: '🖥️',
          description: 'DeVOS - это ваша операционная система. На рабочем столе расположены приложения. Кликните на иконку, чтобы открыть приложение. Вы можете перетаскивать иконки.',
          tips: [
            'Alt+S - открыть меню Пуск',
            'Перетащите иконки для удобства',
            'Позиции сохраняются автоматически'
          ],
          relatedApp: 'ide'
        },
        {
          id: 'room',
          title: 'Ваша комната',
          icon: '🏠',
          description: 'Комната - ваше рабочее пространство. Здесь стоит ваш ПК. Кликните на компьютер, чтобы войти в DeVOS. Нажмите ESC чтобы вернуться в комнату.',
          tips: [
            'Улучшайте комплектующие ПК',
            'Покупайте декор в CyberBay',
            'Следите за температурой системы'
          ]
        }
      ]
    },
    {
      id: 'coding',
      title: 'Программирование',
      icon: '💻',
      color: '#3B82F6',
      sections: [
        {
          id: 'ide',
          title: 'IDE - Среда разработки',
          icon: '⌨️',
          description: 'Главный инструмент программиста. Здесь вы пишете код, создаёте проекты и зарабатываете деньги. Кликайте по кнопке Code или включите авто-код.',
          tips: [
            'Больше кликов = больше строк кода',
            'Изучайте языки для бонусов',
            'Автокод работает в фоне'
          ],
          relatedApp: 'ide'
        },
        {
          id: 'terminal',
          title: 'Терминал',
          icon: '📟',
          description: 'Командная строка для хакеров. Введите help для списка команд. Используйте для быстрых операций и взлома.',
          tips: [
            'help - список команд',
            'scan - сканировать сеть',
            'hack <target> - начать взлом'
          ],
          relatedApp: 'ide'
        },
        {
          id: 'visual-editor',
          title: 'Визуальный редактор',
          icon: '🔗',
          description: 'Создавайте приложения без написания кода! Соединяйте блоки логики и компилируйте в рабочий код.',
          tips: [
            'Перетащите узлы для создания логики',
            'Соедините входы и выходы',
            'Нажмите Compile для генерации кода'
          ],
          relatedApp: 'ide'
        }
      ]
    },
    {
      id: 'projects',
      title: 'Проекты',
      icon: '🚀',
      color: '#A855F7',
      sections: [
        {
          id: 'create-project',
          title: 'Создание проекта',
          icon: '📁',
          description: 'Проекты - основной источник дохода. Выберите шаблон (сайт, приложение, игра) и начните разработку. Чем сложнее проект - тем больше награда.',
          tips: [
            'Начните с простых сайтов',
            'Следите за дедлайнами',
            'Баги снижают качество'
          ],
          relatedApp: 'projects'
        },
        {
          id: 'release',
          title: 'Релиз проекта',
          icon: '🎉',
          description: 'Когда код готов - выпустите проект. Вы получите деньги, репутацию и возможно чертежи от корпораций.',
          tips: [
            'Чем больше кода - тем выше награда',
            'Меньше багов = бонус к качеству',
            'Выпускайте регулярно для репутации'
          ],
          relatedApp: 'projects'
        }
      ]
    },
    {
      id: 'economy',
      title: 'Экономика',
      icon: '💰',
      color: '#F59E0B',
      sections: [
        {
          id: 'money',
          title: 'Деньги ($)',
          icon: '💵',
          description: 'Основная валюта. Зарабатывайте на проектах, продаже предметов и заданиях корпораций. Тратьте на железо, софт и декор.',
          tips: [
            'Проекты - главный доход',
            'Продавайте ненужные чертежи',
            'Выполняйте задания корпораций'
          ]
        },
        {
          id: 'shadow-credits',
          title: 'Shadow Credits (SC)',
          icon: '🌑',
          description: 'Теневая валюта тёмной сети. Получайте за взломы и задания в DarkHub. Обменивайте на редкие предметы.',
          tips: [
            'Взламывайте системы для SC',
            'Курс зависит от Heat',
            'DarkHub принимает только SC'
          ],
          relatedApp: 'browser'
        },
        {
          id: 'bank',
          title: 'NeoBank',
          icon: '🏦',
          description: 'Банковские услуги: кредиты, вклады, оплата счетов. Следите за счетами - неоплата ведёт к штрафам!',
          tips: [
            'Кредит = быстрые деньги, но %',
            'Оплачивайте счета вовремя',
            'Кредитный рейтинг важен'
          ],
          relatedApp: 'bank'
        },
        {
          id: 'cyberbay',
          title: 'CyberBay',
          icon: '🛒',
          description: 'Магазин железа и софта. Покупайте комплектующие для ПК, декор для комнаты и программы.',
          tips: [
            'Железо улучшает скорость кода',
            'Декор влияет на настроение',
            'Следите за акциями'
          ],
          relatedApp: 'browser'
        },
        {
          id: 'darkhub',
          title: 'DarkHub',
          icon: '👁️',
          description: 'Теневой рынок для хакеров. Редкие чертежи, хакерские инструменты и секретные контракты. Нужен сигнал доступа!',
          tips: [
            'Получите сигнал через взлом',
            'Оплата только Shadow Credits',
            'Будьте осторожны - высокий Heat опасен'
          ],
          relatedApp: 'browser'
        }
      ]
    },
    {
      id: 'corporations',
      title: 'Корпорации',
      icon: '🏢',
      color: '#EC4899',
      sections: [
        {
          id: 'corps-overview',
          title: 'Мир корпораций',
          icon: '🌐',
          description: '6 мегакорпораций контролируют CyberNation. У каждой свои цели, технологии и секреты. Выбирайте сторону мудро!',
          tips: [
            'TITAN - S-Tier, AI и нейросети',
            'Orbitron - спутники и связь',
            'NovaTek - игровое железо'
          ],
          relatedApp: 'corporations'
        },
        {
          id: 'reputation',
          title: 'Репутация',
          icon: '⭐',
          description: 'Ваше отношение с корпорацией. От "врага" до "элиты". Чем выше ранг - тем лучше награды и доступ.',
          tips: [
            'Выполняйте задания для репутации',
            'Релизы тоже дают репутацию',
            'Враждебные действия снижают её'
          ],
          relatedApp: 'corporations'
        },
        {
          id: 'membership',
          title: 'Членство',
          icon: '👤',
          description: 'Вступите в корпорацию для полного доступа. 6 рангов от Рекрута до Директора. Каждый ранг даёт привилегии.',
          tips: [
            'Можно быть членом только 1 корпорации',
            'Ранги: Recruit → Member → Specialist → Manager → Director → Executive',
            'Платите ежемесячные взносы'
          ],
          relatedApp: 'corporations'
        },
        {
          id: 'quests',
          title: 'Задания корпораций',
          icon: '📜',
          description: 'Выполняйте контракты для корпораций. Ежедневные, недельные и сюжетные квесты с уникальными наградами.',
          tips: [
            'Daily - быстрые, малые награды',
            'Weekly - сложнее, но щедрее',
            'Story - уникальные награды и сюжет'
          ],
          relatedApp: 'corporations'
        },
        {
          id: 'labs',
          title: 'Лаборатории',
          icon: '🔬',
          description: 'Корпоративные лаборатории с AI-ядрами и хранилищами чертежей. Высокие ранги дают доступ к исследованиям.',
          tips: [
            'AI Cores ускоряют работу',
            'Blueprint Vault хранит чертежи',
            'Research Projects открывают новое'
          ],
          relatedApp: 'corporations'
        },
        {
          id: 'wars',
          title: 'Корпоративные войны',
          icon: '⚔️',
          description: 'Корпорации воюют за территорию и влияние. Участвуйте на стороне своей корпорации в масштабных конфликтах.',
          tips: [
            'Войны дают огромные награды',
            'Защищайте свою корпорацию',
            'Следите за балансом сил'
          ],
          relatedApp: 'corporations'
        }
      ]
    },
    {
      id: 'blueprints',
      title: 'Чертежи',
      icon: '📜',
      color: '#8B5CF6',
      sections: [
        {
          id: 'blueprints-overview',
          title: 'Система чертежей',
          icon: '📋',
          description: 'Чертежи - схемы для крафта уникальных компонентов. 6 тиров редкости, 9 типов компонентов.',
          tips: [
            'T1-T2: Обычные, легко достать',
            'T3-T4: Редкие, хорошие бонусы',
            'T5-T6: Легендарные, лучшие в игре'
          ],
          relatedApp: 'blueprints'
        },
        {
          id: 'crafting',
          title: 'Крафт',
          icon: '🔨',
          description: 'Создавайте компоненты из чертежей. Шанс успеха зависит от вашего уровня и тира чертежа.',
          tips: [
            'Высокий уровень = выше шанс',
            'Провал уничтожает материалы',
            'Успех даёт уникальный предмет'
          ],
          relatedApp: 'blueprints'
        },
        {
          id: 'blueprint-types',
          title: 'Типы чертежей',
          icon: '🗂️',
          description: 'CPU, GPU, RAM, SSD, Cooler, Case - стандартное железо. AI-Core, Quantum-Node, Neural-Chip - продвинутые технологии.',
          tips: [
            'AI-Core от TITAN Industries',
            'Quantum-Node - квантовые вычисления',
            'Neural-Chip - нейроинтерфейсы'
          ],
          relatedApp: 'blueprints'
        }
      ]
    },
    {
      id: 'skills',
      title: 'Навыки',
      icon: '🧠',
      color: '#06B6D4',
      sections: [
        {
          id: 'skill-tree',
          title: 'Дерево навыков',
          icon: '🌳',
          description: 'Развивайте свои способности. Каждый навык даёт постоянные бонусы к различным аспектам игры.',
          tips: [
            'Начните с базовых навыков',
            'Специализируйтесь в 1-2 ветках',
            'Высокие навыки очень дорогие'
          ],
          relatedApp: 'skills'
        },
        {
          id: 'player-role',
          title: 'Роль игрока',
          icon: '🎭',
          description: '5 ролей со уникальными бонусами: Programmer (+25% скорость), Engineer (-15% цены), Hacker (+30% взлом), Security (+40% защита), Trader (+20% торговля).',
          tips: [
            'Выбирается при создании персонажа',
            'Бонусы работают автоматически',
            'Комбинируйте с навыками'
          ]
        },
        {
          id: 'tiers',
          title: 'Уровни карьеры',
          icon: '📈',
          description: '5 уровней карьеры: Trainee → Junior → Middle → Senior → Architect. Повышение происходит автоматически по репутации.',
          tips: [
            'Trainee: 0 репутации',
            'Senior: 2000 репутации',
            'Architect: 10000 репутации (MAX)'
          ]
        }
      ]
    },
    {
      id: 'hacking',
      title: 'Хакинг',
      icon: '👾',
      color: '#EF4444',
      sections: [
        {
          id: 'hacking-basics',
          title: 'Основы взлома',
          icon: '🔓',
          description: 'Взламывайте системы для Shadow Credits и секретных данных. Мини-игра с таймером и головоломками.',
          tips: [
            'Решайте головоломки быстро',
            'Провал повышает Heat',
            'Высокий Heat = опасность рейда'
          ]
        },
        {
          id: 'heat-trace',
          title: 'Heat и Trace',
          icon: '🌡️',
          description: 'Heat - уровень внимания к вам. Trace - шанс рейда полиции. Снижайте Heat через время или взятки.',
          tips: [
            '100% Heat = высокий риск',
            'Рейд отнимает деньги и SC',
            'Лежите низко после взломов'
          ]
        }
      ]
    },
    {
      id: 'social',
      title: 'Социальное',
      icon: '💬',
      color: '#10B981',
      sections: [
        {
          id: 'messenger',
          title: 'Signal Messenger',
          icon: '📨',
          description: 'Общайтесь с NPC и другими игроками. Получайте задания, подсказки и новости.',
          tips: [
            'Проверяйте новые сообщения',
            'NPC дают полезные советы',
            'Ответы влияют на историю'
          ],
          relatedApp: 'messenger'
        },
        {
          id: 'global-chat',
          title: 'Глобальный чат',
          icon: '🌍',
          description: 'Общий чат сервера. Торговля, обсуждения, помощь новичкам. 3 канала: General, Trade, ShadowNet.',
          tips: [
            'General - общий разговор',
            'Trade - торговля между игроками',
            'ShadowNet - секретный канал'
          ]
        },
        {
          id: 'leaderboard',
          title: 'Таблица лидеров',
          icon: '🏆',
          description: 'Рейтинги игроков по разным категориям: деньги, репутация, код, взломы.',
          tips: [
            'Стремитесь в ТОП-10',
            'Награды за высокие места',
            'Обновляется в реальном времени'
          ],
          relatedApp: 'leaderboard'
        }
      ]
    },
    {
      id: 'advanced',
      title: 'Продвинутое',
      icon: '⚡',
      color: '#6366F1',
      sections: [
        {
          id: 'devfs',
          title: 'DevFS - Файловая система',
          icon: '💾',
          description: 'Виртуальная файловая система. Все ваши проекты, сайты и файлы хранятся здесь. Полная история версий!',
          tips: [
            'Проекты в /projects',
            'Сайты в /sites',
            'История версий для отката'
          ],
          relatedApp: 'devfs'
        },
        {
          id: 'user-apps',
          title: 'Пользовательские приложения',
          icon: '📦',
          description: 'Создавайте свои приложения в Visual Editor. Они появляются на рабочем столе и могут продаваться!',
          tips: [
            'Используйте Visual Editor',
            'Компилируйте и тестируйте',
            'Продавайте в CyberBay'
          ],
          relatedApp: 'ide'
        },
        {
          id: 'shards',
          title: 'Серверы (Шарды)',
          icon: '🌐',
          description: '6 серверов с разными правилами. Множители экономики, PvP режим, хардкор. Выбирайте под свой стиль!',
          tips: [
            'Arcade-1: Обычный режим',
            'Hardcore-EU: Без пермадеса',
            'PvP-Asia: Соревновательный'
          ]
        },
        {
          id: 'achievements',
          title: 'Достижения',
          icon: '🏅',
          description: 'Выполняйте условия для получения достижений. Бонусы, титулы и эксклюзивные награды.',
          tips: [
            'Проверяйте прогресс в профиле',
            'Редкие достижения дают много',
            'Некоторые секретные!'
          ]
        }
      ]
    }
  ],
  en: [
    // English content - simplified version
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: '🚀',
      color: '#22C55E',
      sections: [
        {
          id: 'welcome',
          title: 'Welcome to DevTycoon!',
          icon: '👋',
          description: 'You are a budding developer in CyberNation. Your goal is to become a legendary programmer, build an empire, and uncover corporate secrets.',
          tips: [
            'Start with simple tasks in IDE',
            'Save money to upgrade your PC',
            'Learn skills in the skill tree'
          ]
        }
      ]
    }
    // ... more categories would follow
  ],
  uk: [
    // Ukrainian content - based on Russian version
    {
      id: 'getting-started',
      title: 'Початок гри',
      icon: '🚀',
      color: '#22C55E',
      sections: [
        {
          id: 'welcome',
          title: 'Ласкаво просимо до DevTycoon!',
          icon: '👋',
          description: 'Ви - початківець-розробник у світі CyberNation. Ваша мета - стати легендарним програмістом, побудувати імперію та розкрити таємниці корпорацій.',
          tips: [
            'Почніть з простих завдань в IDE',
            'Заощаджуйте гроші для апгрейду ПК',
            'Вивчайте навички у дереві вмінь'
          ]
        }
      ]
    }
    // ... more categories would follow
  ]
};

// ============================================
// COMPONENT
// ============================================
export const TutorialGuide: React.FC<TutorialGuideProps> = ({
  language,
  onClose,
  onHighlightApp
}) => {
  const [selectedCategory, setSelectedCategory] = useState<CategoryId>('getting-started');
  const [selectedSection, setSelectedSection] = useState<string>('welcome');

  const content = GUIDE_CONTENT[language] || GUIDE_CONTENT.ru;
  const category = content.find(c => c.id === selectedCategory);
  const section = category?.sections.find(s => s.id === selectedSection);

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white font-sans">
      {/* Header */}
      <div className="p-4 border-b border-white/10 bg-black/30">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold flex items-center gap-2">
            📚 Путеводитель по DevTycoon
          </h1>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center text-red-400"
          >
            ✕
          </button>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Всё что нужно знать о мире CyberNation
        </p>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Categories Sidebar */}
        <div className="w-48 border-r border-white/10 bg-black/20 overflow-y-auto">
          {content.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setSelectedSection(cat.sections[0]?.id || '');
              }}
              className={`w-full text-left px-3 py-3 border-l-3 transition-all ${
                selectedCategory === cat.id
                  ? 'bg-white/10 border-l-4'
                  : 'border-l-transparent hover:bg-white/5'
              }`}
              style={{
                borderLeftColor: selectedCategory === cat.id ? cat.color : 'transparent'
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{cat.icon}</span>
                <span className="text-sm font-medium">{cat.title}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Sections List */}
        <div className="w-56 border-r border-white/10 bg-black/10 overflow-y-auto">
          {category?.sections.map(sec => (
            <button
              key={sec.id}
              onClick={() => setSelectedSection(sec.id)}
              className={`w-full text-left px-3 py-2 transition-all flex items-center gap-2 ${
                selectedSection === sec.id
                  ? 'bg-white/15 text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span>{sec.icon}</span>
              <span className="text-xs">{sec.title}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {section && (
            <div className="max-w-2xl">
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-4">
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                  style={{ backgroundColor: category?.color + '30' }}
                >
                  {section.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{section.title}</h2>
                  <span 
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ backgroundColor: category?.color + '30', color: category?.color }}
                  >
                    {category?.title}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white/5 rounded-lg p-4 mb-4 border border-white/10">
                <p className="text-slate-300 leading-relaxed">
                  {section.description}
                </p>
              </div>

              {/* Tips */}
              {section.tips && section.tips.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-slate-400 mb-2 flex items-center gap-2">
                    💡 Советы
                  </h3>
                  <div className="space-y-2">
                    {section.tips.map((tip, i) => (
                      <div 
                        key={i}
                        className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2"
                      >
                        <span className="text-yellow-400">•</span>
                        <span className="text-sm text-yellow-200">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related App Button */}
              {section.relatedApp && onHighlightApp && (
                <button
                  onClick={() => onHighlightApp(section.relatedApp!)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition-colors"
                >
                  <span>🔍</span>
                  <span className="text-sm">Открыть приложение</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/10 bg-black/30 text-center text-xs text-slate-500">
        Версия 6.0 • REDMAP 85% Complete • © CyberNation 2025
      </div>
    </div>
  );
};

export default TutorialGuide;
