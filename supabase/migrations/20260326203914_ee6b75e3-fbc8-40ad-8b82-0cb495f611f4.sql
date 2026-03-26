
-- Insert 60 item exchange templates (items → items only, reward_ell = 0)

-- ===== TIER 1: Лёгкие (20 шт, weight 8-10, min_level 1) =====

INSERT INTO item_exchange_templates (title_ru, title_en, description_ru, description_en, icon, required_items, reward_items, reward_ell, weight, min_level, is_active)
VALUES
('Хитиновый сбор', 'Chitin Collection', 'Соберите фрагменты хитина для обмена', '', '🕷️', '[{"template_id":13,"quantity":2}]', '[{"template_id":10,"quantity":1}]', 0, 10, 1, true),
('Древесная заготовка', 'Wood Gathering', 'Принесите древесные чурки', '', '🪵', '[{"template_id":48,"quantity":2}]', '[{"template_id":11,"quantity":1}]', 0, 10, 1, true),
('Каменный промысел', 'Stone Trade', 'Обменяйте камни горной породы', '', '🪨', '[{"template_id":50,"quantity":2}]', '[{"template_id":14,"quantity":1}]', 0, 9, 1, true),
('Слизь медузоидов', 'Jellyfish Slime', 'Соберите слизь медузоидов', '', '🫧', '[{"template_id":69,"quantity":3}]', '[{"template_id":17,"quantity":1}]', 0, 9, 1, true),
('Ржавые наконечники', 'Rusty Harpoons', 'Принесите ржавые наконечники гарпунов', '', '🔱', '[{"template_id":63,"quantity":2}]', '[{"template_id":64,"quantity":1}]', 0, 9, 1, true),
('Жаберная ткань', 'Gill Tissue', 'Соберите испорченную жаберную ткань', '', '🐟', '[{"template_id":62,"quantity":2}]', '[{"template_id":65,"quantity":1}]', 0, 9, 1, true),
('Коралловые наросты', 'Coral Growths', 'Принесите наросты коралла', '', '🐚', '[{"template_id":73,"quantity":3}]', '[{"template_id":68,"quantity":1}]', 0, 8, 1, true),
('Известковые иглы', 'Limestone Needles', 'Обменяйте острые иглы', '', '🦔', '[{"template_id":81,"quantity":2}]', '[{"template_id":72,"quantity":1}]', 0, 8, 1, true),
('Механизм времени', 'Time Mechanism', 'Соберите детали механизма', '', '⚙️', '[{"template_id":131,"quantity":2},{"template_id":132,"quantity":1}]', '[{"template_id":76,"quantity":1}]', 0, 8, 1, true),
('Шестерёнки', 'Gears Trade', 'Обменяйте шестерёнки', '', '⚙️', '[{"template_id":134,"quantity":3}]', '[{"template_id":79,"quantity":1}]', 0, 8, 1, true),
('Пустынные трофеи', 'Desert Trophies', 'Принесите трофеи из пустыни', '', '🏜️', '[{"template_id":137,"quantity":2},{"template_id":138,"quantity":1}]', '[{"template_id":82,"quantity":1}]', 0, 8, 1, true),
('Хитиновый песок', 'Chitin Sand', 'Обменяйте мешки с хитиновым песком', '', '🕷️', '[{"template_id":141,"quantity":2}]', '[{"template_id":92,"quantity":1}]', 0, 8, 1, true),
('Геодезические камни', 'Geodesic Stones', 'Принесите геодезические камни', '', '💎', '[{"template_id":142,"quantity":2}]', '[{"template_id":97,"quantity":1}]', 0, 8, 1, true),
('Клинки осколо', 'Oskolo Blades', 'Соберите клинки осколо', '', '⚔️', '[{"template_id":148,"quantity":3}]', '[{"template_id":10,"quantity":1}]', 0, 9, 1, true),
('Осколки реальности', 'Reality Shards', 'Обменяйте осколки и нити', '', '🔮', '[{"template_id":150,"quantity":2},{"template_id":154,"quantity":1}]', '[{"template_id":11,"quantity":1}]', 0, 8, 1, true),
('Костяные короны', 'Bone Crowns', 'Принесите короны костей', '', '🦴', '[{"template_id":156,"quantity":2}]', '[{"template_id":17,"quantity":1}]', 0, 8, 1, true),
('Хитин ясновидца', 'Seer Chitin', 'Соберите хитин ясновидца', '', '👁️', '[{"template_id":182,"quantity":3}]', '[{"template_id":14,"quantity":1}]', 0, 8, 1, true),
('Обломки и буры', 'Debris and Drills', 'Принесите щит обломков и сердечник', '', '🛡️', '[{"template_id":184,"quantity":2},{"template_id":180,"quantity":1}]', '[{"template_id":64,"quantity":1}]', 0, 8, 1, true),
('Пыльца окаменения', 'Petrification Pollen', 'Обменяйте пыльцу окаменения', '', '🌿', '[{"template_id":178,"quantity":2}]', '[{"template_id":65,"quantity":1}]', 0, 8, 1, true),
('Эссенция хаоса', 'Chaos Essence', 'Соберите эссенцию хаоса', '', '🌀', '[{"template_id":187,"quantity":3}]', '[{"template_id":68,"quantity":1}]', 0, 8, 1, true),

-- ===== TIER 2: Средние (20 шт, weight 5-7, min_level 3) =====

('Паучий сплав', 'Spider Alloy', 'Объедините клыки и глаза пауков', '', '🕷️', '[{"template_id":10,"quantity":2},{"template_id":11,"quantity":1}]', '[{"template_id":12,"quantity":1}]', 0, 7, 3, true),
('Паучьи волокна', 'Spider Fibers', 'Обменяйте конечности и яйца', '', '🕸️', '[{"template_id":14,"quantity":2},{"template_id":17,"quantity":1}]', '[{"template_id":15,"quantity":1}]', 0, 7, 3, true),
('Ядовитая железа', 'Venom Gland', 'Соберите компоненты для железы яда', '', '🧪', '[{"template_id":10,"quantity":1},{"template_id":13,"quantity":2}]', '[{"template_id":16,"quantity":1}]', 0, 6, 3, true),
('Зуб мурены', 'Moray Tooth', 'Принесите кости и чешую', '', '🦷', '[{"template_id":64,"quantity":2},{"template_id":65,"quantity":1}]', '[{"template_id":66,"quantity":1}]', 0, 6, 3, true),
('Баночка с ядом', 'Poison Jar', 'Соберите желе и слизь', '', '🧪', '[{"template_id":68,"quantity":2},{"template_id":69,"quantity":3}]', '[{"template_id":67,"quantity":1}]', 0, 6, 3, true),
('Ядовитое щупальце', 'Toxic Tentacle', 'Обменяйте клешни и кораллы', '', '🐙', '[{"template_id":72,"quantity":1},{"template_id":73,"quantity":2}]', '[{"template_id":70,"quantity":1}]', 0, 6, 3, true),
('Окаменевшая кожа', 'Petrified Skin', 'Принесите рукояти дубин', '', '🪨', '[{"template_id":76,"quantity":2}]', '[{"template_id":74,"quantity":1}]', 0, 5, 3, true),
('Чешуя саблезубки', 'Sabertooth Scale', 'Соберите пену и иглы', '', '🐊', '[{"template_id":79,"quantity":1},{"template_id":81,"quantity":2}]', '[{"template_id":77,"quantity":1}]', 0, 5, 3, true),
('Зубы саблезубки', 'Sabertooth Teeth', 'Обменяйте едкую слизь', '', '🦷', '[{"template_id":82,"quantity":2}]', '[{"template_id":78,"quantity":1}]', 0, 5, 3, true),
('Хитин слизне-краба', 'Slug Crab Chitin', 'Принесите жабры и ткань', '', '🦀', '[{"template_id":92,"quantity":1},{"template_id":62,"quantity":3}]', '[{"template_id":83,"quantity":1}]', 0, 5, 3, true),
('Вода глубин', 'Deep Water', 'Обменяйте присоски и кости', '', '💧', '[{"template_id":97,"quantity":2},{"template_id":64,"quantity":1}]', '[{"template_id":87,"quantity":1}]', 0, 5, 3, true),
('Прессованный хитин', 'Pressed Chitin', 'Соберите хитин и конечности', '', '🕷️', '[{"template_id":13,"quantity":3},{"template_id":14,"quantity":1}]', '[{"template_id":88,"quantity":1}]', 0, 5, 3, true),
('Тёмно-синяя кожа', 'Dark Blue Skin', 'Принесите чешую и глаза', '', '🐍', '[{"template_id":65,"quantity":2},{"template_id":11,"quantity":1}]', '[{"template_id":93,"quantity":1}]', 0, 5, 3, true),
('Шип плавника', 'Fin Spike', 'Соберите разные компоненты', '', '🐠', '[{"template_id":10,"quantity":1},{"template_id":17,"quantity":1},{"template_id":50,"quantity":2}]', '[{"template_id":96,"quantity":1}]', 0, 5, 3, true),
('Магические корни', 'Magic Roots', 'Обменяйте древесину и рукояти', '', '🌿', '[{"template_id":48,"quantity":3},{"template_id":76,"quantity":1}]', '[{"template_id":49,"quantity":1}]', 0, 6, 3, true),
('Светящаяся приманка', 'Glowing Lure', 'Принесите глаза и камни', '', '✨', '[{"template_id":11,"quantity":2},{"template_id":142,"quantity":2}]', '[{"template_id":107,"quantity":1}]', 0, 6, 3, true),
('Крюк капитана', 'Captain Hook', 'Соберите наконечники и кости', '', '🪝', '[{"template_id":63,"quantity":3},{"template_id":64,"quantity":1}]', '[{"template_id":119,"quantity":1}]', 0, 6, 3, true),
('Кость морского черта', 'Anglerfish Bone', 'Обменяйте желе и кораллы', '', '🦴', '[{"template_id":68,"quantity":2},{"template_id":73,"quantity":2}]', '[{"template_id":120,"quantity":1}]', 0, 5, 3, true),
('Змеиная чешуя', 'Snake Scale', 'Принесите слизь и чешую', '', '🐍', '[{"template_id":82,"quantity":1},{"template_id":65,"quantity":1}]', '[{"template_id":125,"quantity":1}]', 0, 5, 3, true),
('Эфирная лоза', 'Ether Vine', 'Соберите механизмы', '', '🌱', '[{"template_id":131,"quantity":2},{"template_id":134,"quantity":2},{"template_id":132,"quantity":1}]', '[{"template_id":54,"quantity":1}]', 0, 5, 3, true),

-- ===== TIER 3: Сложные (15 шт, weight 2-4, min_level 5) =====

('Пыльца иллюзии', 'Illusion Pollen', 'Обменяйте редкие компоненты пауков', '', '🔮', '[{"template_id":12,"quantity":1},{"template_id":16,"quantity":1}]', '[{"template_id":19,"quantity":1}]', 0, 4, 5, true),
('Крыло виверны', 'Wyvern Wing', 'Принесите сухожилия и когти', '', '🐉', '[{"template_id":15,"quantity":1},{"template_id":31,"quantity":1}]', '[{"template_id":20,"quantity":1}]', 0, 3, 5, true),
('Коготь охотника', 'Hunter Claw', 'Соберите железы яда и жала', '', '🗡️', '[{"template_id":16,"quantity":2},{"template_id":24,"quantity":1}]', '[{"template_id":21,"quantity":1}]', 0, 3, 5, true),
('Концентрированный яд', 'Concentrated Venom', 'Обменяйте яды и щупальца', '', '☠️', '[{"template_id":67,"quantity":1},{"template_id":70,"quantity":1}]', '[{"template_id":25,"quantity":1}]', 0, 3, 5, true),
('Клык берсерка', 'Berserker Fang', 'Соберите хелицеры и когти', '', '⚔️', '[{"template_id":12,"quantity":1},{"template_id":31,"quantity":1},{"template_id":13,"quantity":2}]', '[{"template_id":28,"quantity":1}]', 0, 3, 5, true),
('Шипастый панцирь', 'Spiked Shell', 'Принесите чешую и зубы', '', '🛡️', '[{"template_id":77,"quantity":1},{"template_id":78,"quantity":1}]', '[{"template_id":71,"quantity":1}]', 0, 3, 5, true),
('Хрусталик глаза', 'Eye Crystal', 'Обменяйте кожу и камни', '', '👁️', '[{"template_id":74,"quantity":1},{"template_id":50,"quantity":2}]', '[{"template_id":75,"quantity":1}]', 0, 3, 5, true),
('Кристаллы духов', 'Spirit Crystals', 'Соберите корни и лозы', '', '💎', '[{"template_id":49,"quantity":1},{"template_id":54,"quantity":1}]', '[{"template_id":51,"quantity":1}]', 0, 2, 5, true),
('Сердцевина клешни', 'Claw Core', 'Принесите хитиновые пластины', '', '🦀', '[{"template_id":83,"quantity":2},{"template_id":88,"quantity":1}]', '[{"template_id":84,"quantity":1}]', 0, 2, 5, true),
('Перламутровый осколок', 'Pearl Shard', 'Обменяйте воду и кожу', '', '🐚', '[{"template_id":87,"quantity":1},{"template_id":93,"quantity":1}]', '[{"template_id":85,"quantity":1}]', 0, 2, 5, true),
('Сердцевина брони', 'Armor Core', 'Соберите хитин и хелицеры', '', '🛡️', '[{"template_id":88,"quantity":2},{"template_id":12,"quantity":1}]', '[{"template_id":89,"quantity":1}]', 0, 2, 5, true),
('Мозговой комок', 'Brain Mass', 'Принесите приманку и шипы', '', '🧠', '[{"template_id":107,"quantity":1},{"template_id":96,"quantity":1}]', '[{"template_id":106,"quantity":1}]', 0, 2, 5, true),
('Сверкающий кристалл', 'Sparkling Crystal', 'Обменяйте крюк и кость', '', '💎', '[{"template_id":119,"quantity":1},{"template_id":120,"quantity":1}]', '[{"template_id":108,"quantity":1}]', 0, 2, 5, true),
('Монокль тьмы', 'Dark Monocle', 'Соберите масло и корни', '', '🔮', '[{"template_id":56,"quantity":1},{"template_id":49,"quantity":1}]', '[{"template_id":53,"quantity":1}]', 0, 2, 5, true),
('Желчь змеи', 'Snake Bile', 'Принесите чешую и яд', '', '🐍', '[{"template_id":125,"quantity":1},{"template_id":67,"quantity":1}]', '[{"template_id":124,"quantity":1}]', 0, 2, 5, true),

-- ===== TIER 4: Элитные (5 шт, weight 1, min_level 8) =====

('Сердце виверны', 'Wyvern Heart', 'Обменяйте эпические трофеи виверны', '', '❤️‍🔥', '[{"template_id":20,"quantity":1},{"template_id":21,"quantity":1}]', '[{"template_id":29,"quantity":1}]', 0, 1, 8, true),
('Сердцевина шелка', 'Silk Core', 'Принесите клык и железу', '', '🕸️', '[{"template_id":28,"quantity":1},{"template_id":25,"quantity":1}]', '[{"template_id":22,"quantity":1}]', 0, 1, 8, true),
('Усиленный хитин', 'Reinforced Chitin', 'Соберите пыльцу и символ', '', '🛡️', '[{"template_id":19,"quantity":1},{"template_id":34,"quantity":1}]', '[{"template_id":23,"quantity":1}]', 0, 1, 8, true),
('Тенетная железа', 'Web Gland', 'Обменяйте редчайшие железы', '', '🕷️', '[{"template_id":32,"quantity":1},{"template_id":41,"quantity":1}]', '[{"template_id":27,"quantity":1}]', 0, 1, 8, true),
('Панцирь титана', 'Titan Shell', 'Принесите легендарные компоненты', '', '⚡', '[{"template_id":46,"quantity":1},{"template_id":55,"quantity":1}]', '[{"template_id":30,"quantity":1}]', 0, 1, 8, true);
