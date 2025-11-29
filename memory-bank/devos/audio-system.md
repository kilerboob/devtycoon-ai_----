# Audio Interaction System — Звуковая Система

Audio System отвечает за все звуковые эффекты DeVOS и мира CyberNation.

## Категории звуков

1. **OS Sounds (DeVOS Core)**
   - Старт системы.
   - Открытие/закрытие окон.
   - Ошибки.
   - Уведомления.

2. **Social & Calls**
   - Входящие/исходящие звонки.
   - Ответ/завершение звонка.
   - Сообщения в чат.
   - Системные сообщения.

3. **Hacking & Security**
   - Начало взлома.
   - Прогресс/пульсация атаки.
   - Успешный взлом.
   - Провал.
   - Обнаружение IDS.

4. **Threats & Government**
   - Угрозы от NPC/корпораций.
   - Счета за свет/налоги.
   - Отключение электричества.
   - Правительственные уведомления.

5. **Ambient & World**
   - Планета (CyberNation Globe).
   - Комнаты игроков.
   - Лаборатории.
   - Серверные.

## Интеграция

Используется модуль `utils/sound.ts`:

```ts
export const SFX = {
  os_open: 'os_open.ogg',
  os_close: 'os_close.ogg',
  os_error: 'os_error.ogg',
  chat_message: 'chat_message.ogg',
  chat_group: 'chat_group.ogg',
  call_incoming: 'call_incoming.ogg',
  call_end: 'call_end.ogg',
  hack_start: 'hack_start.ogg',
  hack_success: 'hack_success.ogg',
  hack_fail: 'hack_fail.ogg',
  gov_warning: 'gov_warning.ogg',
  threat_message: 'threat_message.ogg',
  bill_warning: 'bill_warning.ogg',
  room_ambient: 'room_ambient.ogg',
  planet_ambient: 'planet_ambient.ogg'
}
```

В UI-компонентах вызывается через:

```ts
import { play } from '../utils/sound';
import { SFX } from '../utils/sfx-map';

play(SFX.chat_message);
```

