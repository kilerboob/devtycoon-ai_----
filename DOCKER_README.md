# DevTycoon AI - Docker Setup

## Быстрый запуск

Запустите весь проект (фронтенд + бэкенд + PostgreSQL) одной командой:

```bash
docker-compose up -d
```

Приложение будет доступно на:
- **Фронтенд**: http://localhost
- **API бэкенда**: http://localhost:3000
- **PostgreSQL**: localhost:5432

## Остановка

```bash
docker-compose down
```

Для удаления данных БД:
```bash
docker-compose down -v
```

## Логи

Просмотр логов всех сервисов:
```bash
docker-compose logs -f
```

Логи конкретного сервиса:
```bash
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f postgres
```

## Перезапуск после изменений

```bash
docker-compose down
docker-compose up -d --build
```

## Переменные окружения

Создайте `.env` в корне для кастомизации:

```env
# PostgreSQL
POSTGRES_USER=devtycoon
POSTGRES_PASSWORD=devtycoon_pass
POSTGRES_DB=devtycoon_db

# Backend
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://devtycoon:devtycoon_pass@postgres:5432/devtycoon_db
```

## Архитектура

- **Frontend**: React + Vite → Nginx (порт 80)
- **Backend**: Node.js + Express (порт 3000)
- **Database**: PostgreSQL 15 (порт 5432)

Nginx проксирует `/api/*` и `/socket.io/*` на бэкенд автоматически.
