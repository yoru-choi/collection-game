-- Additional sample characters
INSERT INTO characters (name, grade, element, class, base_hp, base_atk, base_def, base_spd, skill_1_id, skill_2_id, skill_3_id, skill_4_id, image_url)
SELECT 'Frost Archer', 3, 'water', 'assassin', 820, 150, 70, 115, 1, 2, 8, 3, '/images/characters/frost_archer.png'
WHERE NOT EXISTS (SELECT 1 FROM characters WHERE name = 'Frost Archer');

INSERT INTO characters (name, grade, element, class, base_hp, base_atk, base_def, base_spd, skill_1_id, skill_2_id, skill_3_id, skill_4_id, image_url)
SELECT 'Ember Guard', 2, 'fire', 'tank', 950, 90, 120, 70, 1, 2, 3, 6, '/images/characters/ember_guard.png'
WHERE NOT EXISTS (SELECT 1 FROM characters WHERE name = 'Ember Guard');

INSERT INTO characters (name, grade, element, class, base_hp, base_atk, base_def, base_spd, skill_1_id, skill_2_id, skill_3_id, skill_4_id, image_url)
SELECT 'Verdant Sage', 4, 'wind', 'support', 980, 120, 95, 100, 1, 4, 6, 5, '/images/characters/verdant_sage.png'
WHERE NOT EXISTS (SELECT 1 FROM characters WHERE name = 'Verdant Sage');

INSERT INTO characters (name, grade, element, class, base_hp, base_atk, base_def, base_spd, skill_1_id, skill_2_id, skill_3_id, skill_4_id, image_url)
SELECT 'Radiant Lancer', 4, 'light', 'warrior', 1150, 150, 110, 90, 1, 2, 3, 6, '/images/characters/radiant_lancer.png'
WHERE NOT EXISTS (SELECT 1 FROM characters WHERE name = 'Radiant Lancer');

INSERT INTO characters (name, grade, element, class, base_hp, base_atk, base_def, base_spd, skill_1_id, skill_2_id, skill_3_id, skill_4_id, image_url)
SELECT 'Nightshade Witch', 5, 'dark', 'mage', 920, 185, 75, 98, 1, 2, 7, 4, '/images/characters/nightshade_witch.png'
WHERE NOT EXISTS (SELECT 1 FROM characters WHERE name = 'Nightshade Witch');

-- Additional story dungeons (chapter 1 hard, chapter 2 normal)
INSERT INTO dungeons (name, dungeon_type, difficulty, chapter, stage, energy_cost, stages, rewards, exp_reward, gold_reward)
SELECT 'Chapter 1-1 (Hard): The Beginning', 'story', 'hard', 1, 1, 7,
       '[{"wave":1,"enemies":[{"character_id":15,"level":6},{"character_id":16,"level":6}]}]'
       , '[{"type":"gold","amount":220},{"type":"exp","amount":120}]', 120, 220
WHERE NOT EXISTS (SELECT 1 FROM dungeons WHERE name = 'Chapter 1-1 (Hard): The Beginning');

INSERT INTO dungeons (name, dungeon_type, difficulty, chapter, stage, energy_cost, stages, rewards, exp_reward, gold_reward)
SELECT 'Chapter 1-2 (Hard): Forest Path', 'story', 'hard', 1, 2, 7,
       '[{"wave":1,"enemies":[{"character_id":17,"level":7},{"character_id":15,"level":7}]}]'
       , '[{"type":"gold","amount":240},{"type":"exp","amount":130}]', 130, 240
WHERE NOT EXISTS (SELECT 1 FROM dungeons WHERE name = 'Chapter 1-2 (Hard): Forest Path');

INSERT INTO dungeons (name, dungeon_type, difficulty, chapter, stage, energy_cost, stages, rewards, exp_reward, gold_reward)
SELECT 'Chapter 2-1: Mountain Pass', 'story', 'normal', 2, 1, 6,
       '[{"wave":1,"enemies":[{"character_id":19,"level":5},{"character_id":20,"level":5}]}]'
       , '[{"type":"gold","amount":160},{"type":"exp","amount":90},{"type":"crystal","amount":5}]', 90, 160
WHERE NOT EXISTS (SELECT 1 FROM dungeons WHERE name = 'Chapter 2-1: Mountain Pass');

INSERT INTO dungeons (name, dungeon_type, difficulty, chapter, stage, energy_cost, stages, rewards, exp_reward, gold_reward)
SELECT 'Chapter 2-2: Cliffside', 'story', 'normal', 2, 2, 6,
       '[{"wave":1,"enemies":[{"character_id":21,"level":6},{"character_id":22,"level":6}]}]'
       , '[{"type":"gold","amount":180},{"type":"exp","amount":95}]', 95, 180
WHERE NOT EXISTS (SELECT 1 FROM dungeons WHERE name = 'Chapter 2-2: Cliffside');

INSERT INTO dungeons (name, dungeon_type, difficulty, chapter, stage, energy_cost, stages, rewards, exp_reward, gold_reward)
SELECT 'Chapter 2-3: Ancient Gate', 'story', 'normal', 2, 3, 7,
       '[{"wave":1,"enemies":[{"character_id":23,"level":7},{"character_id":19,"level":7}]},{"wave":2,"enemies":[{"character_id":24,"level":8}]}]'
       , '[{"type":"gold","amount":220},{"type":"exp","amount":120},{"type":"crystal","amount":10}]', 120, 220
WHERE NOT EXISTS (SELECT 1 FROM dungeons WHERE name = 'Chapter 2-3: Ancient Gate');

-- Additional shop items (gold, crystals, energy, characters, bundles)
INSERT INTO shop_items (name, description, item_type, currency_type, price, item_data, stock, refresh_type, is_active)
SELECT 'Crystal Shard S', 'Get 20 crystals instantly', 'crystal', 'gold', 2000, '{"amount":20}'::jsonb, -1, 'never', TRUE
WHERE NOT EXISTS (SELECT 1 FROM shop_items WHERE name = 'Crystal Shard S');

INSERT INTO shop_items (name, description, item_type, currency_type, price, item_data, stock, refresh_type, is_active)
SELECT 'Crystal Shard M', 'Get 60 crystals instantly', 'crystal', 'gold', 5000, '{"amount":60}'::jsonb, -1, 'never', TRUE
WHERE NOT EXISTS (SELECT 1 FROM shop_items WHERE name = 'Crystal Shard M');

INSERT INTO shop_items (name, description, item_type, currency_type, price, item_data, stock, refresh_type, is_active)
SELECT 'Gold Chest', 'Get 10,000 gold instantly', 'gold', 'crystal', 50, '{"amount":10000}'::jsonb, -1, 'never', TRUE
WHERE NOT EXISTS (SELECT 1 FROM shop_items WHERE name = 'Gold Chest');

INSERT INTO shop_items (name, description, item_type, currency_type, price, item_data, stock, refresh_type, is_active)
SELECT 'Energy Elixir', 'Recover 120 energy', 'energy', 'crystal', 80, '{"amount":120}'::jsonb, -1, 'never', TRUE
WHERE NOT EXISTS (SELECT 1 FROM shop_items WHERE name = 'Energy Elixir');

INSERT INTO shop_items (name, description, item_type, currency_type, price, item_data, stock, refresh_type, is_active)
SELECT 'Hero Ticket: Verdant Sage', 'Recruit Verdant Sage (4★)', 'character', 'crystal', 180, '{"character_id":21}'::jsonb, -1, 'never', TRUE
WHERE NOT EXISTS (SELECT 1 FROM shop_items WHERE name = 'Hero Ticket: Verdant Sage');

INSERT INTO shop_items (name, description, item_type, currency_type, price, item_data, stock, refresh_type, is_active)
SELECT 'Beginner Bundle', 'Crystals + Gold + Energy', 'package', 'crystal', 450,
       '{"package":[{"type":"crystal","amount":150},{"type":"gold","amount":10000},{"type":"energy","amount":80}]}'::jsonb,
       -1, 'never', TRUE
WHERE NOT EXISTS (SELECT 1 FROM shop_items WHERE name = 'Beginner Bundle');

-- Additional quests (weekly + achievement)
INSERT INTO quests (name, description, quest_type, condition_type, condition_target, rewards, order_index, is_active)
SELECT 'Weekly Dungeon Runner', 'Clear 20 dungeons', 'weekly', 'dungeon_clear', 20,
       '[{"type":"crystal","amount":50}]'::jsonb, 1, TRUE
WHERE NOT EXISTS (SELECT 1 FROM quests WHERE name = 'Weekly Dungeon Runner');

INSERT INTO quests (name, description, quest_type, condition_type, condition_target, rewards, order_index, is_active)
SELECT 'Weekly Summoner', 'Summon 10 times', 'weekly', 'summon', 10,
       '[{"type":"gold","amount":5000}]'::jsonb, 2, TRUE
WHERE NOT EXISTS (SELECT 1 FROM quests WHERE name = 'Weekly Summoner');

INSERT INTO quests (name, description, quest_type, condition_type, condition_target, rewards, order_index, is_active)
SELECT 'First Steps', 'Clear your first dungeon', 'achievement', 'dungeon_clear', 1,
       '[{"type":"crystal","amount":20}]'::jsonb, 1, TRUE
WHERE NOT EXISTS (SELECT 1 FROM quests WHERE name = 'First Steps');

-- Extend daily login rewards (days 8-14)
INSERT INTO daily_login_rewards (day, rewards)
SELECT 8, '[{"type":"gold","amount":2000}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM daily_login_rewards WHERE day = 8);

INSERT INTO daily_login_rewards (day, rewards)
SELECT 9, '[{"type":"crystal","amount":20}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM daily_login_rewards WHERE day = 9);

INSERT INTO daily_login_rewards (day, rewards)
SELECT 10, '[{"type":"energy","amount":40}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM daily_login_rewards WHERE day = 10);

INSERT INTO daily_login_rewards (day, rewards)
SELECT 11, '[{"type":"gold","amount":3000}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM daily_login_rewards WHERE day = 11);

INSERT INTO daily_login_rewards (day, rewards)
SELECT 12, '[{"type":"crystal","amount":25}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM daily_login_rewards WHERE day = 12);

INSERT INTO daily_login_rewards (day, rewards)
SELECT 13, '[{"type":"energy","amount":60}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM daily_login_rewards WHERE day = 13);

INSERT INTO daily_login_rewards (day, rewards)
SELECT 14, '[{"type":"gold","amount":4000}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM daily_login_rewards WHERE day = 14);
