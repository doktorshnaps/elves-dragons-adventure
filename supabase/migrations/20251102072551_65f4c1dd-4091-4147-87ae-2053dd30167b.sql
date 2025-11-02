-- Обновляем RLS политику для dungeon_settings чтобы разрешить обновления всем админам
DROP POLICY IF EXISTS "Only admins can update dungeon settings" ON dungeon_settings;

CREATE POLICY "Only admins can update dungeon settings" 
ON dungeon_settings 
FOR UPDATE 
USING (is_admin_or_super_wallet(get_current_user_wallet()));