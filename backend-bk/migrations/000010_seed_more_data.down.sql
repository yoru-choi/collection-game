-- Remove additional characters
DELETE FROM characters WHERE name IN (
  'Frost Archer',
  'Ember Guard',
  'Verdant Sage',
  'Radiant Lancer',
  'Nightshade Witch'
);

-- Remove additional dungeons
DELETE FROM dungeons WHERE name IN (
  'Chapter 1-1 (Hard): The Beginning',
  'Chapter 1-2 (Hard): Forest Path',
  'Chapter 2-1: Mountain Pass',
  'Chapter 2-2: Cliffside',
  'Chapter 2-3: Ancient Gate'
);

-- Remove additional shop items
DELETE FROM shop_items WHERE name IN (
  'Crystal Shard S',
  'Crystal Shard M',
  'Gold Chest',
  'Energy Elixir',
  'Hero Ticket: Verdant Sage',
  'Beginner Bundle'
);

-- Remove additional quests
DELETE FROM quests WHERE name IN (
  'Weekly Dungeon Runner',
  'Weekly Summoner',
  'First Steps'
);

-- Remove additional daily login rewards
DELETE FROM daily_login_rewards WHERE day BETWEEN 8 AND 14;
