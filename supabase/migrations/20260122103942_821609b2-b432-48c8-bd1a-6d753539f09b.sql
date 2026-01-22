-- Удаление дублированных функций: Часть 1 - admin_add_balance
-- Удаляем версию с p_admin_wallet_address, оставляем версию без неё

DROP FUNCTION IF EXISTS public.admin_add_balance(text, numeric, text);

-- Часть 2 - admin_ban_user (удаляем версию с 3 параметрами)
DROP FUNCTION IF EXISTS public.admin_ban_user(text, text, text);

-- Часть 3 - admin_unban_user (удаляем версию с 2 параметрами)  
DROP FUNCTION IF EXISTS public.admin_unban_user(text, text);

-- Часть 4 - admin_give_player_card (удаляем версию с 4 параметрами)
DROP FUNCTION IF EXISTS public.admin_give_player_card(text, text, text, jsonb);

-- Часть 5 - admin_remove_player_item (удаляем версию с 2 параметрами)
DROP FUNCTION IF EXISTS public.admin_remove_player_item(text, text);

-- Часть 6 - admin_remove_player_card (удаляем версию с 2 параметрами)
DROP FUNCTION IF EXISTS public.admin_remove_player_card(text, text);