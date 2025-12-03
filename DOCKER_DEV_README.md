# DevTycoon AI - Docker Dev Mode (Hot Reload)

## Быстрый запуск в режиме разработки

Запустите всё с горячей перезагрузкой:

```bash
docker-compose -f docker-compose.dev.yml up --build
```

Приложение доступно:
- **Фронтенд**: http://localhost:5173 (Vite HMR включён)
- **API бэкенда**: http://localhost:3000 (Nodemon перезапускает при изменениях)
- **PostgreSQL**: localhost:5432

## Что работает автоматически

### Фронтенд (React + Vite)
- ✅ Мгновенная горячая замена модулей (HMR)
- ✅ Изменения в `src/`, `components/`, `utils/`, `services/` применяются без перезапуска
- ✅ Polling включён для работы в Docker

### Бэкенд (Node.js + TypeScript)
- ✅ Nodemon перезапускает сервер при изменении `.ts` файлов в `backend/src/`
- ✅ TypeScript компиляция на лету через `ts-node`

### База данных
- ✅ PostgreSQL с персистентным volume для dev-данных
- ✅ SQL скрипты автоматически применяются при первом запуске

## Команды

### Запуск
```bash
docker-compose -f docker-compose.dev.yml up
```

### Запуск в фоне
```bash
docker-compose -f docker-compose.dev.yml up -d
```

### Пересборка после изменений package.json
```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Просмотр логов
```bash
# Все сервисы
docker-compose -f docker-compose.dev.yml logs -f

# Только фронтенд
docker-compose -f docker-compose.dev.yml logs -f frontend

# Только бэкенд
docker-compose -f docker-compose.dev.yml logs -f backend
```

### Остановка
```bash
docker-compose -f docker-compose.dev.yml down
```

### Очистка (включая volumes)
```bash
docker-compose -f docker-compose.dev.yml down -v
```

## Структура volumes

- `frontend_node_modules` — node_modules фронтенда (не перезаписывается локальными файлами)
- `backend_node_modules` — node_modules бэкенда (не перезаписывается локальными файлами)
- `postgres_data_dev` — данные PostgreSQL для dev-режима

## Production vs Development

| Режим | Файл | Порт Frontend | Hot Reload | Оптимизация |
|-------|------|---------------|------------|-------------|
| **Development** | `docker-compose.dev.yml` | 5173 | ✅ Да | ❌ Нет |
| **Production** | `docker-compose.yml` | 80 | ❌ Нет | ✅ Да |

## Troubleshooting

### Изменения не применяются
1. Убедитесь, что volumes примонтированы (проверьте `docker-compose.dev.yml`)
2. Перезапустите контейнеры: `docker-compose -f docker-compose.dev.yml restart`

### Ошибки после изменения package.json
Пересоберите образы:
```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Порты заняты
Измените порты в `docker-compose.dev.yml`:
```yaml
ports:
  - "5174:5173"  # Фронт на 5174 вместо 5173
  - "3001:3000"  # Бэк на 3001 вместо 3000
```
