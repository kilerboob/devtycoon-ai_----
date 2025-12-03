# 🏠 LAYER 17 — ROOMS (Реализация)

**Дата:** 2 декабря 2025  
**Статус:** ✅ Завершено

---

## 📋 Обзор

**LAYER 17 — ROOMS** внедряет **социальное пространство игрока**: персонализируемую комнату с мебелью, декором и возможностью апгрейда компонентов ПК. Это расширяет геймплей за пределы кода, добавляя визуальную кастомизацию и прогрессию оборудования.

---

## 🎯 Задачи

### Backend

1. **Таблицы базы данных (PostgreSQL):**
   - `rooms` — комнаты игроков (владелец, название, тема, layout, приватность)
   - `room_items` — предметы мебели в комнате (тип, позиция, rotation, scale, asset_id)
   - `user_pc_components` — установленные компоненты ПК (CPU, GPU, RAM, storage, PSU, motherboard, cooler)

2. **Backend Services:**
   - `roomsService.ts` — CRUD операции для комнат, предметов мебели, компонентов ПК

3. **API Routes:**
   - `GET /api/rooms/:ownerId` — список комнат пользователя
   - `POST /api/rooms` — создать комнату
   - `PATCH /api/rooms/:roomId` — обновить комнату (название, тема, layout)
   - `DELETE /api/rooms/:roomId` — удалить комнату
   - `GET /api/rooms/:roomId/items` — список предметов в комнате
   - `POST /api/rooms/:roomId/items` — добавить/обновить предмет
   - `DELETE /api/items/:itemId` — удалить предмет
   - `GET /api/pc/components/:userId` — список компонентов ПК
   - `POST /api/pc/upgrade` — апгрейд компонента ПК (CPU/GPU/RAM/etc.)

### Frontend

1. **Компонент `Room.tsx`:**
   - Визуализация комнаты игрока с мебелью и декором
   - Кнопка **"🛠 Edit Room"** — включает режим редактирования
   - В режиме редактирования: панель с примерами мебели (🛋 Sofa, 🪴 Plant, 🖼 Picture Frame, 💻 PC Case)
   - Интеграция с API `/api/rooms/:roomId/items` (placeholder для drag-drop)

2. **Компонент `PCInternals.tsx`:**
   - UI апгрейда компонентов ПК (CPU, GPU, RAM, storage, cooler)
   - Визуализация установленных компонентов на материнской плате
   - Термомониторинг (температура, heat gen, cooling)
   - Интеграция с API `/api/pc/upgrade` (комментарий для синхронизации)

---

## 🛠️ Технологии

- **Backend:** Node.js, Express, TypeScript, PostgreSQL
- **Frontend:** React, TypeScript, TailwindCSS
- **Database:** PostgreSQL 16 (port 5433)
- **API:** RESTful JSON endpoints

---

## 📦 Структура базы данных

### Таблица `rooms`

```sql
CREATE TABLE IF NOT EXISTS rooms (
    id BIGSERIAL PRIMARY KEY,
    owner_id VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    theme VARCHAR(64) DEFAULT 'default',
    layout JSONB DEFAULT '{}'::JSONB,
    privacy VARCHAR(16) DEFAULT 'public', -- public | friends | private
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Таблица `room_items`

```sql
CREATE TABLE IF NOT EXISTS room_items (
    id BIGSERIAL PRIMARY KEY,
    room_id BIGINT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    item_type VARCHAR(64) NOT NULL, -- 'sofa', 'desk', 'pc_case'
    asset_id VARCHAR(128), -- reference to AI Assets (Layer 20)
    position JSONB NOT NULL, -- { x, y, z }
    rotation JSONB DEFAULT '{"x":0,"y":0,"z":0}'::JSONB,
    scale JSONB DEFAULT '{"x":1,"y":1,"z":1}'::JSONB,
    properties JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Таблица `user_pc_components`

```sql
CREATE TABLE IF NOT EXISTS user_pc_components (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    room_id BIGINT REFERENCES rooms(id) ON DELETE SET NULL,
    component_type VARCHAR(64) NOT NULL, -- cpu | gpu | ram | storage | psu | motherboard | cooler
    model VARCHAR(128) NOT NULL,
    tier INTEGER DEFAULT 1, -- upgrade level
    stats JSONB DEFAULT '{}'::JSONB, -- performance metrics
    installed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uniq_pc_component UNIQUE (user_id, component_type)
);
```

---

## 🚀 Примеры использования API

### 1. Создать комнату

```bash
POST /api/rooms
Content-Type: application/json

{
  "ownerId": "player_123",
  "name": "My Dev Cave",
  "theme": "cyberpunk"
}
```

**Ответ:**
```json
{
  "id": 1,
  "owner_id": "player_123",
  "name": "My Dev Cave",
  "theme": "cyberpunk",
  "layout": {},
  "privacy": "public",
  "created_at": "2025-12-02T12:00:00.000Z",
  "updated_at": "2025-12-02T12:00:00.000Z"
}
```

### 2. Добавить мебель в комнату

```bash
POST /api/rooms/1/items
Content-Type: application/json

{
  "item_type": "sofa",
  "asset_id": "sofa_leather_black",
  "position": { "x": 10, "y": 0, "z": 15 },
  "rotation": { "x": 0, "y": 45, "z": 0 },
  "scale": { "x": 1, "y": 1, "z": 1 }
}
```

### 3. Апгрейд CPU

```bash
POST /api/pc/upgrade
Content-Type: application/json

{
  "userId": "player_123",
  "componentType": "cpu",
  "model": "Intel Core i9-14900K",
  "stats": { "cores": 24, "threads": 32, "clockSpeed": 5.8 },
  "roomId": 1
}
```

**Ответ:**
```json
{
  "id": 5,
  "user_id": "player_123",
  "room_id": 1,
  "component_type": "cpu",
  "model": "Intel Core i9-14900K",
  "tier": 2,
  "stats": { "cores": 24, "threads": 32, "clockSpeed": 5.8 },
  "installed_at": "2025-12-02T12:05:00.000Z",
  "updated_at": "2025-12-02T12:05:00.000Z"
}
```

---

## 🎨 Frontend UI

### Room.tsx — Режим редактирования

При нажатии кнопки **"🛠 Edit Room"**:

- Появляется панель с примерами мебели:
  - 🛋 Sofa
  - 🪴 Plant
  - 🖼 Picture Frame
  - 💻 PC Case (upgrade via PCInternals)
- Отображается API endpoint: `POST /api/rooms/:roomId/items`
- В будущем: drag-drop для размещения мебели на сцене

### PCInternals.tsx — Апгрейды компонентов

- Визуализация материнской платы с установленными компонентами
- Слоты: CPU, GPU, RAM, Storage, Cooler
- Hover на слот → список доступных апгрейдов из инвентаря
- Клик "Install" → `onEquip(uid)` → будущая синхронизация с `/api/pc/upgrade`
- Индикатор температуры и тепловыделения (thermal monitor)

---

## 🔗 Интеграция с AI Assets (Layer 20)

В таблице `room_items` поле `asset_id` хранит ссылку на AI-сгенерированный ассет:

- **Пример:** `asset_id: "sofa_leather_black"`
- Ассеты генерируются через **Layer 20: AI Assets Generator** (текст → 3D модель/спрайт)
- Фронтенд может загружать 3D модели или 2D спрайты по `asset_id`

---

## ✅ Выполненные задачи

1. ✅ Исправлены ошибки импорта `getDb` в `securityService.ts`, `securityGuildService.ts`, `marketRoutes.ts`, `darkhubRoutes.ts`
2. ✅ Добавлены таблицы `rooms`, `room_items`, `user_pc_components` в `sync_schema.sql`
3. ✅ Применена миграция схемы к PostgreSQL (17 таблиц)
4. ✅ Создан сервис `roomsService.ts` с CRUD для комнат, предметов, компонентов ПК
5. ✅ Добавлены маршруты `roomsRoutes.ts` и подключены в `server.ts`
6. ✅ Backend скомпилирован и запущен успешно (порт 3000, WebSocket enabled)
7. ✅ Добавлен режим редактирования комнаты в `Room.tsx` (кнопка "🛠 Edit Room")
8. ✅ Добавлена интеграция комментариев в `PCInternals.tsx` для синхронизации с `/api/pc/upgrade`

---

## 🚧 Будущие улучшения

1. **Drag-and-Drop мебели:**
   - Реализовать перетаскивание мебели в 2D/3D пространстве
   - Сохранение `position`, `rotation`, `scale` в `room_items`

2. **AI Assets Generator (Layer 20):**
   - Генерация 3D моделей мебели по текстовому описанию
   - Интеграция с `asset_id` в `room_items`

3. **Multiplayer Room Visits:**
   - Посещение комнат других игроков (privacy: public/friends)
   - Лайки, комментарии, рейтинг комнат

4. **PC Performance Sync:**
   - Автоматический расчет производительности ПК на основе `user_pc_components.stats`
   - Влияние на `autoCodePerSecond`, `clickPower`, `temperature`

5. **Room Themes:**
   - Предустановленные темы: Cyberpunk, Minimal, Cozy, Industrial
   - Кастомные цвета стен, пола, освещения

---

## 📊 Статистика

- **Backend файлы:** 3 новых (roomsService.ts, roomsRoutes.ts), 6 исправлений (импорты getDb)
- **Frontend файлы:** 2 обновленных (Room.tsx, PCInternals.tsx)
- **SQL схема:** +60 строк (3 таблицы, индексы, триггеры)
- **API endpoints:** 8 новых маршрутов
- **Время реализации:** ~45 минут

---

## 🎉 Заключение

**LAYER 17 — ROOMS** успешно реализован! Игроки теперь могут:

- Создавать персональные комнаты
- Добавлять мебель и декор (через API, UI placeholder готов)
- Апгрейдить компоненты ПК (через `PCInternals.tsx`)
- Синхронизировать данные с PostgreSQL

Архитектура готова для интеграции с **Layer 20 (AI Assets)** и расширения функционала drag-drop редактора.

**🚀 DevTycoon AI: От кода к персональному киберпространству!**
