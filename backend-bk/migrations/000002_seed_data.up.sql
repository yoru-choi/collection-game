-- Insert sample skills for testing

-- Basic Attack Skills
INSERT INTO skills (name, description, skill_type, target_type, cooldown, multiplier, effects) VALUES
('Basic Attack', 'A basic physical attack', 'damage', 'single_enemy', 0, 1.0, '[]'),
('Power Strike', 'A powerful strike dealing high damage', 'damage', 'single_enemy', 2, 2.5, '[]'),
('Area Slash', 'Attack all enemies', 'damage', 'all_enemies', 3, 1.5, '[]'),
('Heal', 'Restore HP to an ally', 'heal', 'single_ally', 3, 1.5, '[]'),
('Mass Heal', 'Restore HP to all allies', 'heal', 'all_allies', 5, 1.0, '[]'),
('Attack Buff', 'Increase attack power', 'buff', 'self', 4, 0, '[{"type":"buff","value":50,"duration":3,"stat":"atk"}]'),
('Defense Break', 'Decrease enemy defense', 'debuff', 'single_enemy', 3, 0, '[{"type":"debuff","value":50,"duration":2,"stat":"def"}]'),
('Stun Strike', 'Attack with chance to stun', 'damage', 'single_enemy', 4, 2.0, '[{"type":"stun","value":1,"duration":1}]');

-- Insert sample characters for testing

-- Fire Warriors
INSERT INTO characters (name, grade, element, class, base_hp, base_atk, base_def, base_spd, skill_1_id, skill_2_id, skill_3_id, skill_4_id, image_url) VALUES
('Fire Knight', 4, 'fire', 'warrior', 1200, 150, 100, 90, 1, 2, 3, 8, '/images/characters/fire_knight.png'),
('Flame Mage', 5, 'fire', 'mage', 900, 180, 70, 95, 1, 2, 3, 7, '/images/characters/flame_mage.png'),
('Inferno Assassin', 3, 'fire', 'assassin', 850, 160, 65, 110, 1, 2, 8, 7, '/images/characters/inferno_assassin.png');

-- Water Characters
INSERT INTO characters (name, grade, element, class, base_hp, base_atk, base_def, base_spd, skill_1_id, skill_2_id, skill_3_id, skill_4_id, image_url) VALUES
('Ocean Priestess', 5, 'water', 'healer', 950, 120, 90, 100, 1, 4, 5, 6, '/images/characters/ocean_priestess.png'),
('Tidal Warrior', 4, 'water', 'warrior', 1300, 140, 110, 85, 1, 2, 3, 6, '/images/characters/tidal_warrior.png'),
('Water Spirit', 2, 'water', 'mage', 700, 130, 60, 90, 1, 2, 3, 4, '/images/characters/water_spirit.png');

-- Wind Characters
INSERT INTO characters (name, grade, element, class, base_hp, base_atk, base_def, base_spd, skill_1_id, skill_2_id, skill_3_id, skill_4_id, image_url) VALUES
('Storm Ranger', 4, 'wind', 'assassin', 900, 170, 70, 120, 1, 2, 8, 3, '/images/characters/storm_ranger.png'),
('Wind Dancer', 3, 'wind', 'support', 800, 110, 75, 105, 1, 4, 6, 5, '/images/characters/wind_dancer.png'),
('Gale Warrior', 1, 'wind', 'warrior', 800, 100, 80, 80, 1, 2, 3, 6, '/images/characters/gale_warrior.png');

-- Light Characters
INSERT INTO characters (name, grade, element, class, base_hp, base_atk, base_def, base_spd, skill_1_id, skill_2_id, skill_3_id, skill_4_id, image_url) VALUES
('Holy Paladin', 5, 'light', 'tank', 1500, 130, 140, 75, 1, 2, 4, 6, '/images/characters/holy_paladin.png'),
('Divine Priest', 4, 'light', 'healer', 1000, 115, 85, 95, 1, 4, 5, 6, '/images/characters/divine_priest.png'),
('Light Sword', 2, 'light', 'warrior', 850, 120, 85, 85, 1, 2, 3, 6, '/images/characters/light_sword.png');

-- Dark Characters
INSERT INTO characters (name, grade, element, class, base_hp, base_atk, base_def, base_spd, skill_1_id, skill_2_id, skill_3_id, skill_4_id, image_url) VALUES
('Shadow Assassin', 5, 'dark', 'assassin', 850, 190, 65, 115, 1, 2, 8, 7, '/images/characters/shadow_assassin.png'),
('Dark Mage', 4, 'dark', 'mage', 900, 175, 70, 92, 1, 2, 7, 3, '/images/characters/dark_mage.png'),
('Necromancer', 3, 'dark', 'mage', 880, 155, 68, 88, 1, 2, 7, 4, '/images/characters/necromancer.png'),
('Dark Knight', 1, 'dark', 'warrior', 900, 110, 90, 75, 1, 2, 3, 6, '/images/characters/dark_knight.png');

-- Add more common characters
INSERT INTO characters (name, grade, element, class, base_hp, base_atk, base_def, base_spd, skill_1_id, skill_2_id, skill_3_id, skill_4_id, image_url) VALUES
('Novice Fighter', 1, 'fire', 'warrior', 600, 80, 60, 70, 1, 2, 3, 6, '/images/characters/novice_fighter.png'),
('Apprentice Mage', 1, 'water', 'mage', 500, 90, 50, 75, 1, 2, 3, 4, '/images/characters/apprentice_mage.png'),
('Village Guard', 1, 'wind', 'tank', 700, 70, 80, 65, 1, 2, 3, 6, '/images/characters/village_guard.png'),
('Scout', 2, 'wind', 'assassin', 650, 110, 55, 100, 1, 2, 8, 3, '/images/characters/scout.png'),
('Cleric', 2, 'light', 'healer', 700, 85, 65, 80, 1, 4, 5, 6, '/images/characters/cleric.png');

-- Insert sample dungeons

-- Story dungeons
INSERT INTO dungeons (name, dungeon_type, difficulty, chapter, stage, energy_cost, stages, rewards, exp_reward, gold_reward) VALUES
('Chapter 1-1: The Beginning', 'story', 'normal', 1, 1, 5, 
 '[{"wave":1,"enemies":[{"character_id":15,"level":1},{"character_id":15,"level":1}]}]',
 '[{"type":"gold","amount":100},{"type":"exp","amount":50}]',
 50, 100),
 
('Chapter 1-2: Forest Path', 'story', 'normal', 1, 2, 5,
 '[{"wave":1,"enemies":[{"character_id":15,"level":2},{"character_id":16,"level":2}]}]',
 '[{"type":"gold","amount":120},{"type":"exp","amount":60}]',
 60, 120),

('Chapter 1-3: Cave Entrance', 'story', 'normal', 1, 3, 6,
 '[{"wave":1,"enemies":[{"character_id":17,"level":3},{"character_id":15,"level":3}]},{"wave":2,"enemies":[{"character_id":18,"level":3}]}]',
 '[{"type":"gold","amount":150},{"type":"exp","amount":80},{"type":"crystal","amount":10}]',
 80, 150);

-- Element dungeons
INSERT INTO dungeons (name, dungeon_type, difficulty, chapter, stage, energy_cost, stages, rewards, exp_reward, gold_reward) VALUES
('Fire Dungeon', 'element', 'normal', 0, 1, 10,
 '[{"wave":1,"enemies":[{"character_id":1,"level":5},{"character_id":2,"level":5}]}]',
 '[{"type":"material","name":"fire_essence","amount":5}]',
 100, 200),

('Water Dungeon', 'element', 'normal', 0, 1, 10,
 '[{"wave":1,"enemies":[{"character_id":4,"level":5},{"character_id":5,"level":5}]}]',
 '[{"type":"material","name":"water_essence","amount":5}]',
 100, 200);

-- Experience dungeon
INSERT INTO dungeons (name, dungeon_type, difficulty, chapter, stage, energy_cost, stages, rewards, exp_reward, gold_reward) VALUES
('Experience Dungeon', 'experience', 'normal', 0, 1, 8,
 '[{"wave":1,"enemies":[{"character_id":15,"level":5}]}]',
 '[{"type":"exp_crystal","amount":10}]',
 500, 50);

-- Gold dungeon
INSERT INTO dungeons (name, dungeon_type, difficulty, chapter, stage, energy_cost, stages, rewards, exp_reward, gold_reward) VALUES
('Gold Dungeon', 'gold', 'normal', 0, 1, 8,
 '[{"wave":1,"enemies":[{"character_id":15,"level":5}]}]',
 '[{"type":"gold","amount":1000}]',
 100, 1000);
