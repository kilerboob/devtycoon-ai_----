# DevFS — Спецификация Виртуальной Файловой Системы DeVOS

DevFS — виртуальный диск внутри DeVOS, обеспечивающий хранение файлов, проектов, сайтов, конфигов, чертежей и логов.

## Цели

- Объединить все данные OS и мира (DeVOS/CyberNation) в единую абстракцию файловой системы.
- Обеспечить стабильный API для IDE, приложений, рынка, лабораторий и сетевых операций.
- Подготовить систему для синхронизации с серверной БД.

## Базовые сущности

- **DevFile**
  - id: string
  - path: string (`/projects/foo/main.js`)
  - type: "file"
  - fileType: "code" | "config" | "graph" | "site" | "blueprint" | "asset" | ...
  - owner: userId / system
  - content: string / binary
  - meta: { createdAt, updatedAt, tags[] }

- **DevFolder**
  - path: string
  - type: "folder"
  - meta: { createdAt, tags[] }

- **DevProject**
  - id: string
  - rootPath: string (`/projects/my_game`)
  - ownerId: string
  - type: "app" | "site" | "game" | "tool"
  - files: список ссылок на DevFile
  - meta: { status, revenue, rating }

## Namespace'ы

Рекомендуемые корневые пространства:

- `/projects` — проекты игроков и студий.
- `/apps` — установленные приложения DeVOS.
- `/sites` — внутренние сайты CyberNet.
- `/system` — конфиги OS.
- `/blueprints` — общие чертежи (при необходимости).
- `/corporations` — файлы корпораций/лаб.
- `/user/<id>` — личные файлы пользователя (комната, ПК-конфиги, приватные заметки).

## API devStorage (клиентская абстракция)

```ts
interface DevStorage {
  createFile(path: string, type: DevFileType, content: string): Promise<DevFile>;
  readFile(path: string): Promise<DevFile | null>;
  updateFile(path: string, content: string): Promise<DevFile>;
  deleteFile(path: string): Promise<void>;
  createFolder(path: string): Promise<DevFolder>;
  listFolder(path: string): Promise<Array<DevFile | DevFolder>>;
  moveFile(pathFrom: string, pathTo: string): Promise<void>;
  renameFile(path: string, newName: string): Promise<void>;
}
```

Реализация может использовать IndexedDB локально и/или REST/WebSocket на сервере.

## Интеграции

- **IDE**: редакция кода/графов.
- **ProjectsApp**: список проектов и их файлов.
- **Browser**: загрузка сайтов из DevFS.
- **DarkHub/CyberBay**: хранение описаний товаров как файлов.
- **Hacking Layer**: кража DevFS файлов у NPC/корпораций.
- **Backup & Sync**: перенос DevFS содержимого на бэкенд.

