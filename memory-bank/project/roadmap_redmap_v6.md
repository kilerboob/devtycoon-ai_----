# REDMAP v6.0 — DeVOS / CyberNation Unified Roadmap

Этот документ описывает по слоям всю целевую архитектуру игры DevTycoon / DeVOS MMO (вселенная CyberNation).
Любые изменения в проекте должны соотноситься с этим планом. Новые фичи всегда мапятся на слой.

## LAYER 0 — Game Core

- DeVOS OS: Desktop, окна, таскбар, приложения.
- Комната игрока (Room) и ПК (PCInternals).
- Базовые приложения: Browser, ProjectsApp, SkillTree, Settings, MusicPlayer, Messenger, DarkHub, CyberBay.
- Tools: VisualEditor, UserAppRunner, visualCompiler, Terminal.
- Services: dbService, onlineMock, geminiService.

## LAYER 1 — DevFS (Virtual Disk)

Цель: превратить DeVOS в настоящую файловую систему.

- Вводится DevFS — виртуальный диск, живущий в IndexedDB/БД.
- Понятия: DevFile, DevFolder, DevProject, DevFileType.
- API devStorage:
  - createFile(path, type, content)
  - readFile(path)
  - updateFile(path, content)
  - deleteFile(path)
  - createFolder(path)
  - listFolder(path)
  - moveFile(pathFrom, pathTo)
  - renameFile(path, newName)
- DevFS используется:
  - IDE (VisualEditor, Runner).
  - ProjectsApp.
  - StorageApp (проводник).
  - Browser (сайты в /sites).
  - DarkHub / CyberBay (цифровые товары, чертежи).

## LAYER 2 — IDE Upgrade (DevStudio Evolution)

Цель: DevStudio работает как мини-VSCode.

- VisualEditor хранит графы в DevFS (`/projects/<project>/graph.json`).
- Runner запускает JS-код из DevFS в песочнице.
- Monitor умеет открывать файл в редакторе и логирует вывод.
- IDE становится подписанной на DevFS-события (create/update/delete).

## LAYER 3 — DeVOS System 4.0

Цель: OS становится полноценной системой.

- Desktop показывает системные папки: /apps, /projects, /sites, /storage.
- StorageApp: древовидный браузер DevFS.
- Browser: умеет открывать сайты из DevFS (`/sites/<site>/index.html`).
- SettingsApp:
  - System Disk / проверка файловой системы.
  - Cache management.
  - Firewall (базовый слой безопасности).
- Уровень темизации и аудио (см. Audio System).

## LAYER 4 — Shards & Network Layer

Цель: подготовить игру к MMO.

- Shards (EU-West, US-East, UA, Asia, и т.п.).
- AuthScreen: выбор шарда/региона при входе.
- GameState.currentShard.
- onlineMock: эмуляция задержек, отказов, шард-зависимых событий.

## LAYER 5 — Corporations

Цель: добавить крупные силы мира.

Примерный список корпораций:
- TITAN Industries — CPU, AI-чипы.
- NovaTek Labs — память, SSD, хранилища.
- CyberForge Systems — корпуса, охлаждение, серверные блоки.
- BlackSun Dynamics — кибероружие, вирусы, нелегальные прототипы.
- Orbitron SpaceWorks — спутниковая инфраструктура, глобальная сеть.

Каждая корпорация имеет:
- Лаборатории.
- AI Core.
- Наборы чертежей (Blueprints).
- Исследовательское дерево.
- Репутацию и влияние на планете.

## LAYER 6 — Labs (Research Facilities)

Цель: точки PvE/PvP активности и источник технологий.

- Лаборатории содержат:
  - AI Core (LabCore).
  - Blueprint Vault (хранилище чертежей).
  - Prototype Vault.
  - Research Stations.
  - Систему защиты (firewalls, IDS, ловушки).
- Игроки:
  - Взламывают лаборатории.
  - Крадут чертежи и прототипы.
  - Оставляют бэкдоры.
- Корпорации:
  - Обнаруживают взлом.
  - Отправляют гильдии Security.
  - Запускают расследования.

## LAYER 7 — Blueprint System

Цель: формализовать технологии как чертежи.

- Типы: cpu, gpu, ssd, case, cooler, ai-core, quantum-node.
- Редкости:
  - T1 — Common
  - T2 — Advanced
  - T3 — Rare
  - T4 — Prototype
  - T5 — Legendary
  - T6 — Experimental
- Blueprint хранится как DevFile в DevFS.
- Используется для:
  - Крафта комплектующих.
  - Улучшения ПК.
  - Продажи на рынках (Legit, DarkHub).
  - Прогресса корпораций.

## LAYER 8 — Player Roles

Основные роли:
- Programmer — разработчик ПО, сайтов, внутренних утилит.
- Engineer — инженер ПК и железа, сборка и оптимизация.
- Hacker — взломщик, кража данных, атаки.
- Security — защитник, расследования, защита корпораций и игроков.
- Trader — торговец, рынок, arbitrage, посредник.

Роль определяет:
- Дерево навыков.
- Доступные приложения и квесты.
- Скорость прогресса в разных системах.

## LAYER 9 — Player Tiers (Career System)

- Trainee
- Junior
- Middle
- Senior
- Architect

Тир влияет на:
- Уровень доверия корпораций и NPC.
- Доступ к контрактам.
- Доступ к сложным чертежам и лабораториям.
- Статус в студиях и гильдиях.

## LAYER 10 — GameDev Studios

Цель: «мирный» карьерный путь.

- Студии — команды игроков, создающих проекты (игры, софт, сайты).
- Структура:
  - Owner, Leads, Developers, Designers, Engineers, Testers.
- Возможности:
  - Получать заказы от корпораций.
  - Выпускать продукты в Legal Market.
  - Делить прибыль.
  - Использовать DevFS под свои проекты.

## LAYER 11 — Guilds

Цель: боевые фракции.

Типы:
- Hacker Guild
- Security Guild
- Engineer Guild
- Trader Guild

Гильдии:
- Участвуют в кибервойнах корпораций.
- Выполняют боевые контракты.
- Контролируют части рынков и регионов.

## LAYER 12 — Contracts System

Типы контрактов:
- Нормальные (разработка ПО, сайтов, сборка ПК).
- Корпоративные (R&D, улучшение AI, аудит безопасности).
- Боевые (защита лабораторий, атака на конкурентов).
- Black Contracts (кража чертежей, взлом игроков, внедрение вирусов).

Контракты управляют экономикой и прогрессом.

## LAYER 13 — Planet Sphere

- Планета CyberNation как глобальный шар.
- Отображение:
  - Зон влияния корпораций.
  - Позиции лабораторий.
  - Активных атак и войн.
  - Гильдейских зон.
  - DarkNet регионов.

## LAYER 14 — Hacking Layer

- PvE взлом лабораторий.
- PvP взлом игроков и NPC.
- Инструменты: трояны, эксплойты, сетевые атаки.
- Риски: отслеживание, штрафы, охота гильдий, санкции правительства.

## LAYER 15 — Security Layer

- Защита: DeVOS Firewall, плагины безопасности, гильдии Security.
- Отслеживание атак.
- Логи и расследования.
- Репутационный эффект.

## LAYER 16 — Markets

- Legal Market:
  - ПО, сайты, устройства, услуги студий, легальные детали.
- DarkHub:
  - Украденные чертежи, уязвимости, нелегальные прототипы.

## LAYER 17 — Rooms

- Комнаты игроков как «реальный мир».
- Зависит от роли, тира, корпорации, студии, гильдии.
- Поддерживает кастомизацию и генерацию ассетов.

## LAYER 18 — Server Rooms / Data Centers

- Узлы хранения и вычислений.
- Серверные рейды (гильдии).
- Цели для PvE/PvP.

## LAYER 19 — Lab Designs

- Визуальные и логические паттерны корпоративных лабораторий.
- Зоны высокого риска (DarkZones).

## LAYER 20 — AI Assets

- Генерация изображений комнат, корпораций, планеты, UI-иконок.
- Генерация логотипов корпораций и гильдий.

## LAYER 21 — Social Interaction

- Чаты (Signal 2.0).
- Группы.
- Гильдейские/студийные каналы.
- Системные уведомления.

## LAYER 22 — Calls System

- DeVCall: голосовые/видеозвонки.
- Звонки игрок→игрок, студия, гильдия, корпорации, правительство.

## LAYER 23 — Threat System

- Угрозы от NPC, корпораций, правительства, преступных групп.
- Счета, штрафы, отключение электричества, санкции.

## LAYER 24 — NPC Crime Layer

- Взлом NPC, кража средств, чертежей, проектов.
- Ответные меры: угрозы, жалобы, найм гильдий, гос-давление.

## LAYER 25 — Complaint & Justice System

- Жалобы на NPC, игроков, корпорации.
- Разборы и компенсации.

## LAYER 26 — Social Economy

- Социальные связи, найм, работа в студиях и корпорациях.
- Долги, кредиты, налоги, счета за ресурсы (свет/сеть).

## LAYER 27 — Database Full Schema

- Единая логическая модель данных, покрывающая все системы.

## LAYER 33 — Audio Interaction System

- Звуковые эффекты для OS, чатов, звонков, атак, угроз, мира.
- Ambient планеты, лабораторий, серверных.
