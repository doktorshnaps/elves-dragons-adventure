

## RPC overload conflict — `update_clan_customization`

### Проблема
После добавления `header_background` в БД существуют две версии RPC:
1. `update_clan_customization(p_wallet, p_emblem, p_background_image)` — старая
2. `update_clan_customization(p_wallet, p_emblem, p_background_image, p_header_background)` — новая

PostgREST не может выбрать какую вызывать → ошибка "Could not choose the best candidate function".

Это нарушает memory `database-rpc-standardization`: запрещено перегружать имена функций.

### Фикс

**Migration**: удалить старую 3-аргументную версию, оставить только 4-аргументную.

```sql
DROP FUNCTION IF EXISTS public.update_clan_customization(text, text, text);
```

Новая версия (с `p_header_background`) уже работает корректно — её не трогаем. Клиент уже передаёт все 3 опциональных параметра через `rpcParams`, и сигнатура с 4 аргументами их обработает.

### Проверка
- Лидер открывает «Оформление клана» → загружает иконку/панель/фон → toast «обновлено», изображение появляется без ошибки RPC.
- `SELECT proname, pg_get_function_identity_arguments(oid) FROM pg_proc WHERE proname = 'update_clan_customization'` возвращает ровно одну строку.

### Что НЕ делаю
Не меняю Edge Function `upload-clan-asset` (она работает), не трогаю клиент.

