-- Insert Elleonor Box item template
INSERT INTO public.item_templates (
    id,
    item_id, 
    name, 
    type, 
    rarity, 
    description, 
    image_url, 
    source_type,
    value,
    sell_price,
    drop_chance
) VALUES (
    509,
    'elleonor_box',
    'Сундук Эллеонор',
    'consumable',
    'legendary',
    'Таинственный сундук из банка Эллеонор, наполненный mGT токенами. Открой его, чтобы получить криптовалюту! Выпадает с боссов и мини-боссов.',
    '/src/assets/items/elleonor-box.jpeg',
    'boss_drop',
    0,
    0,
    5
) ON CONFLICT (id) DO NOTHING;