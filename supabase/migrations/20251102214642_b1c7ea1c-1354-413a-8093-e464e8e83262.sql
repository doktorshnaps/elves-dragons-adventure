-- Добавляем всех монстров с изображениями
INSERT INTO monsters (monster_id, monster_name, monster_type, image_url, description, created_by_wallet_address) VALUES
('spider_skeleton', 'Паучок-скелет', 'normal', '/assets/monsters/spider-skeleton.png', 'Скелет маленького паука', 'mr_bruts.tg'),
('spider_jumper', 'Паук-скакун', 'normal', '/assets/monsters/spider-jumper.png', 'Быстрый прыгающий паук', 'mr_bruts.tg'),
('spider_weaver', 'Паук-прядильщик', 'normal', '/assets/monsters/spider-weaver.png', 'Паук, плетущий сети', 'mr_bruts.tg'),
('spider_hunter', 'Паук-охотник', 'normal', '/assets/monsters/spider-hunter.png', 'Опасный охотник', 'mr_bruts.tg'),
('spider_queen_larva', 'Паук-королева-личинка', 'normal', '/assets/monsters/spider-queen-larva.png', 'Личинка королевы пауков', 'mr_bruts.tg'),
('spider_corpse_eater', 'Паук-трупоед', 'normal', '/assets/monsters/spider-corpse-eater.png', 'Питается трупами', 'mr_bruts.tg'),
('spider_guardian', 'Паук-стража', 'normal', '/assets/monsters/spider-guardian.png', 'Охраняет территорию', 'mr_bruts.tg'),
('spider_wyvern', 'Паук-виверна', 'normal', '/assets/monsters/spider-wyvern.png', 'Крылатый паук', 'mr_bruts.tg'),
('shadow_spider_catcher', 'Теневой паук-ловец', 'miniboss', '/assets/monsters/shadow-spider-catcher.png', 'Охотник из теней', 'mr_bruts.tg'),
('ancient_spider', 'Древний паук-отшельник', 'miniboss', '/assets/monsters/ancient-spider-hermit.png', 'Древний отшельник', 'mr_bruts.tg'),
('spider_berserker', 'Паук-берсерк', 'normal', '/assets/monsters/spider-berserker.png', 'Яростный воин', 'mr_bruts.tg'),
('spider_illusionist', 'Паук-иллюзионист', 'normal', '/assets/monsters/spider-illusionist.png', 'Мастер иллюзий', 'mr_bruts.tg'),
('spider_mother', 'Паук-мать-стража', 'miniboss', '/assets/monsters/spider-mother-guardian.png', 'Мать-защитница', 'mr_bruts.tg'),
('spider_parasite', 'Паук-паразит', 'normal', '/assets/monsters/spider-parasite.png', 'Паразитирующий паук', 'mr_bruts.tg'),
('spider_titan', 'Паук-титан', 'miniboss', '/assets/monsters/spider-titan.png', 'Гигантский титан', 'mr_bruts.tg'),
('spider_archmage', 'Арахнидный Архимаг', 'boss', '/assets/monsters/arachnid-archmage.png', 'Верховный маг пауков', 'mr_bruts.tg'),
('arachna_progenitor', 'Арахна Прародительница', 'boss', '/assets/monsters/arachna-progenitor.png', 'Мать всех пауков', 'mr_bruts.tg')
ON CONFLICT (monster_id) DO UPDATE SET
  monster_name = EXCLUDED.monster_name,
  image_url = EXCLUDED.image_url,
  monster_type = EXCLUDED.monster_type,
  description = EXCLUDED.description,
  updated_at = now();