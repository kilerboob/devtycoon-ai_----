# Backend API Plan — DeVOS / CyberNation

Этот документ описывает основные API-модули для серверной части проекта.

## Авторы и цели

- Цель: обеспечить чистые, предсказуемые REST/WebSocket API.
- Все сервисы должны уважать RedMap v6.0 и DevFS.

## Основные сервисы

1. **Auth Service**
   - POST /auth/register
   - POST /auth/login
   - POST /auth/logout
   - POST /auth/refresh
   - GET  /auth/me

2. **DevFS Service**
   - GET    /devfs/tree?path=/...
   - GET    /devfs/file?path=/...
   - POST   /devfs/file        (создание/обновление)
   - DELETE /devfs/file        (удаление)
   - POST   /devfs/folder
   - DELETE /devfs/folder

3. **Projects Service**
   - GET    /projects
   - POST   /projects
   - GET    /projects/{id}
   - PATCH  /projects/{id}
   - DELETE /projects/{id}

4. **Corporations & Labs Service**
   - GET   /corporations
   - GET   /corporations/{id}
   - GET   /corporations/{id}/labs
   - GET   /labs/{id}
   - POST  /labs/{id}/events (логирование атак, миссий)

5. **Blueprints Service**
   - GET   /blueprints
   - GET   /blueprints/{id}
   - POST  /blueprints (для корпораций/админов)
   - GET   /blueprints/search?rarity=&type=

6. **Market Service**
   - GET   /market
   - POST  /market/items
   - POST  /market/items/{id}/buy
   - GET   /darkhub
   - POST  /darkhub/items
   - POST  /darkhub/items/{id}/buy

7. **Social/Signal Service**
   - GET   /messages
   - POST  /messages
   - GET   /threads
   - GET   /calls/history
   - WebSocket /ws/chat
   - WebSocket /ws/call-signal

8. **Hacking & Security**
   - POST /hacking/session/start
   - POST /hacking/session/{id}/action
   - POST /hacking/session/{id}/complete
   - GET  /security/incidents
   - POST /security/report

9. **Planet & Events**
   - GET /planet/state
   - GET /planet/events
   - POST /planet/events (админ/системные события)

