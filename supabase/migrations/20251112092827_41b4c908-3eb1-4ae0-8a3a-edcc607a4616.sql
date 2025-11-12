-- Добавление 4 новых материалов, связанных с гидрой и кораллами
INSERT INTO item_templates (
  item_id,
  name,
  type,
  rarity,
  description,
  value,
  sell_price,
  image_url,
  source_type,
  level_requirement
) VALUES
  (
    'serpent_kinship_bile',
    'Желчь змеиного родства',
    'material',
    'epic',
    'Ядовитая желчь многоголовой гидры. Светится зловещим зелёным светом и пузырится от собственной токсичности.',
    140,
    70,
    '/item-images/serpent_kinship_bile.jpeg',
    'dungeon',
    1
  ),
  (
    'hybrid_serpent_scale',
    'Гибридная змеиная чешуя',
    'material',
    'rare',
    'Уникальная чешуя гидры, сочетающая свойства разных голов. Переливается несколькими цветами одновременно.',
    105,
    52,
    '/item-images/hybrid_serpent_scale.jpeg',
    'dungeon',
    1
  ),
  (
    'coral_rune',
    'Коралловая руна',
    'material',
    'epic',
    'Древний коралл, на котором естественным образом выросли магические руны. Хранит память океана.',
    125,
    62,
    '/item-images/coral_rune.jpeg',
    'dungeon',
    1
  ),
  (
    'coral_dust_pouch',
    'Мешок коралловой пыли',
    'material',
    'uncommon',
    'Мешочек, наполненный измельчённым магическим кораллом. Пыль мерцает при движении.',
    65,
    32,
    '/item-images/coral_dust_pouch.jpeg',
    'dungeon',
    1
  );