-- Seed shop items
INSERT INTO shop_items (name, description, item_type, currency_type, price, item_data, stock, refresh_type, is_active)
SELECT 'Gold Pouch S', 'Get 1,000 gold instantly', 'gold', 'crystal', 10, '{"amount":1000}'::jsonb, -1, 'never', TRUE
WHERE NOT EXISTS (SELECT 1 FROM shop_items WHERE name = 'Gold Pouch S');

INSERT INTO shop_items (name, description, item_type, currency_type, price, item_data, stock, refresh_type, is_active)
SELECT 'Gold Pouch M', 'Get 3,000 gold instantly', 'gold', 'crystal', 25, '{"amount":3000}'::jsonb, -1, 'never', TRUE
WHERE NOT EXISTS (SELECT 1 FROM shop_items WHERE name = 'Gold Pouch M');

INSERT INTO shop_items (name, description, item_type, currency_type, price, item_data, stock, refresh_type, is_active)
SELECT 'Energy Potion', 'Recover 20 energy', 'energy', 'gold', 500, '{"amount":20}'::jsonb, -1, 'never', TRUE
WHERE NOT EXISTS (SELECT 1 FROM shop_items WHERE name = 'Energy Potion');

INSERT INTO shop_items (name, description, item_type, currency_type, price, item_data, stock, refresh_type, is_active)
SELECT 'Energy Potion+', 'Recover 60 energy', 'energy', 'gold', 1200, '{"amount":60}'::jsonb, -1, 'never', TRUE
WHERE NOT EXISTS (SELECT 1 FROM shop_items WHERE name = 'Energy Potion+');

INSERT INTO shop_items (name, description, item_type, currency_type, price, item_data, stock, refresh_type, is_active)
SELECT 'Hero Ticket: Fire Knight', 'Recruit Fire Knight (4★)', 'character', 'crystal', 150, '{"character_id":1}'::jsonb, -1, 'never', TRUE
WHERE NOT EXISTS (SELECT 1 FROM shop_items WHERE name = 'Hero Ticket: Fire Knight');

INSERT INTO shop_items (name, description, item_type, currency_type, price, item_data, stock, refresh_type, is_active)
SELECT 'Starter Pack', 'Gold + Energy + Crystals bundle', 'package', 'crystal', 300,
       '{"package":[{"type":"gold","amount":5000},{"type":"energy","amount":50},{"type":"crystal","amount":50}]}'::jsonb,
       -1, 'never', TRUE
WHERE NOT EXISTS (SELECT 1 FROM shop_items WHERE name = 'Starter Pack');

-- Seed quests
INSERT INTO quests (name, description, quest_type, condition_type, condition_target, rewards, order_index, is_active)
SELECT 'Daily Login', 'Log in once today', 'daily', 'login', 1, '[{"type":"gold","amount":500}]'::jsonb, 1, TRUE
WHERE NOT EXISTS (SELECT 1 FROM quests WHERE name = 'Daily Login');

INSERT INTO quests (name, description, quest_type, condition_type, condition_target, rewards, order_index, is_active)
SELECT 'Daily Summon', 'Summon 1 time', 'daily', 'summon', 1, '[{"type":"crystal","amount":10}]'::jsonb, 2, TRUE
WHERE NOT EXISTS (SELECT 1 FROM quests WHERE name = 'Daily Summon');

INSERT INTO quests (name, description, quest_type, condition_type, condition_target, rewards, order_index, is_active)
SELECT 'Dungeon Clear I', 'Clear 3 dungeons', 'daily', 'dungeon_clear', 3, '[{"type":"gold","amount":800}]'::jsonb, 3, TRUE
WHERE NOT EXISTS (SELECT 1 FROM quests WHERE name = 'Dungeon Clear I');

INSERT INTO quests (name, description, quest_type, condition_type, condition_target, rewards, order_index, is_active)
SELECT 'Collect Gold', 'Collect 2000 gold', 'daily', 'collect_gold', 2000, '[{"type":"crystal","amount":15}]'::jsonb, 4, TRUE
WHERE NOT EXISTS (SELECT 1 FROM quests WHERE name = 'Collect Gold');

INSERT INTO quests (name, description, quest_type, condition_type, condition_target, rewards, order_index, is_active)
SELECT 'Spend Energy', 'Spend 30 energy', 'daily', 'spend_energy', 30, '[{"type":"gold","amount":1000}]'::jsonb, 5, TRUE
WHERE NOT EXISTS (SELECT 1 FROM quests WHERE name = 'Spend Energy');

-- Seed daily login rewards (7-day)
INSERT INTO daily_login_rewards (day, rewards)
SELECT 1, '[{"type":"gold","amount":500}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM daily_login_rewards WHERE day = 1);

INSERT INTO daily_login_rewards (day, rewards)
SELECT 2, '[{"type":"crystal","amount":10}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM daily_login_rewards WHERE day = 2);

INSERT INTO daily_login_rewards (day, rewards)
SELECT 3, '[{"type":"gold","amount":800}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM daily_login_rewards WHERE day = 3);

INSERT INTO daily_login_rewards (day, rewards)
SELECT 4, '[{"type":"crystal","amount":15}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM daily_login_rewards WHERE day = 4);

INSERT INTO daily_login_rewards (day, rewards)
SELECT 5, '[{"type":"energy","amount":30}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM daily_login_rewards WHERE day = 5);

INSERT INTO daily_login_rewards (day, rewards)
SELECT 6, '[{"type":"gold","amount":1500}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM daily_login_rewards WHERE day = 6);

INSERT INTO daily_login_rewards (day, rewards)
SELECT 7, '[{"type":"crystal","amount":30}]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM daily_login_rewards WHERE day = 7);
