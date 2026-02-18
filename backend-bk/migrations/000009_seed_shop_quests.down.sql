-- Remove seeded shop items
DELETE FROM shop_items WHERE name IN (
  'Gold Pouch S',
  'Gold Pouch M',
  'Energy Potion',
  'Energy Potion+',
  'Hero Ticket: Fire Knight',
  'Starter Pack'
);

-- Remove seeded quests
DELETE FROM quests WHERE name IN (
  'Daily Login',
  'Daily Summon',
  'Dungeon Clear I',
  'Collect Gold',
  'Spend Energy'
);

-- Remove seeded daily login rewards
DELETE FROM daily_login_rewards WHERE day BETWEEN 1 AND 7;
