

## Ошибка загрузки изображений клана: "new row violates row-level security policy"

### Что происходит
При загрузке эмблемы/фона/центральной панели клана toast показывает: **"new row violates row-level security policy"**. Ошибка приходит от Supabase Storage (бакет `clan-assets`) — RLS на `storage.objects` отклоняет INSERT.

### Причина
В `ClanCustomization.tsx` загрузка идёт напрямую через `supabase.storage.from('clan-assets').upload(...)`. Это требует, чтобы у пользователя:
1. Была активная Supabase auth-сессия (`auth.uid()` не NULL).
2. RLS-политика на `storage.objects` для бакета `clan-assets` разрешала INSERT для роли клан-лидера.

Но в проекте используется **NEAR-кошелёк** для аутентификации, а не email/password Supabase Auth. По memory `near-wallet-auth-rls-strategy-v3` критичные операции идут через Edge Functions с `SECURITY DEFINER` или service_role, потому что `auth.uid()` не отражает реального игрока. Поэтому direct upload в storage от анонимной сессии падает на RLS.

Дополнительно: даже если сессия есть, RLS-политика бакета `clan-assets` скорее всего проверяет `auth.uid() = clans.leader_wallet`, что работает только с email-юзерами, а не с NEAR-кошельками.

### План фикса

**1. Перенести загрузку через Edge Function `upload-clan-asset`** (по аналогии с `upload-item-image` из memory `image-upload-authorization-workaround`):
- Клиент конвертирует WEBP в base64 и шлёт в функцию вместе с `wallet_address`, `clan_id`, `asset_type` (`emblem` | `background` | `header_background`).
- Функция:
  - Проверяет, что `wallet_address` — лидер/заместитель клана через RPC (например, `is_clan_leader_or_deputy`).
  - Использует `service_role` для обхода RLS storage и заливает файл `clan-assets/{clan_id}/{asset_type}.webp` с `upsert: true`.
  - Возвращает публичный URL.
- Клиент после успеха вызывает существующий RPC `update_clan_customization` (он уже работает и сохраняет URL в БД).

**2. Лимиты валидации** (как сейчас): WEBP only, ≤2 МБ. Дублируем проверку на сервере на случай обхода клиента.

**3. Не трогаем RLS бакета** — оставляем закрытым, всё пишется через service_role в Edge Function. Чтение публичное (бакет уже public для отображения).

### Файлы под изменение
- **Создать** `supabase/functions/upload-clan-asset/index.ts` — Edge Function (validate auth → check leadership via RPC → upload via service_role).
- **Создать** `supabase/config.toml` запись для функции (verify_jwt = false, авторизация через wallet_address как в `upload-item-image`).
- **Изменить** `src/components/game/clan/ClanCustomization.tsx` — заменить direct `storage.upload` на `supabase.functions.invoke('upload-clan-asset', { body: { ... } })`. Добавить хелпер `fileToBase64`.
- **Migration**: добавить RPC `is_clan_leader_or_deputy(p_wallet text, p_clan_id uuid) returns boolean` (SECURITY DEFINER), если такой ещё нет — проверю в default mode.

### Memory update
Дополнить `mem://features/clan-system-customization` правилом: загрузка ассетов клана идёт ТОЛЬКО через Edge Function `upload-clan-asset`, никаких direct storage.upload из клиента.

### Что НЕ делаю
Не меняю RLS storage напрямую, не переписываю систему кланов, не трогаю NEAR-аутентификацию.

### Проверка
- Зайти лидером клана на /clan → загрузить эмблему/фон/панель → toast «обновлено», изображение появляется.
- Не-лидер пробует тот же запрос напрямую → 403 от Edge Function.

