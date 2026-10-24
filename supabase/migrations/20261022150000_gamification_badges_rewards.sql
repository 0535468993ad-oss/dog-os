-- The training gamification grew into its own engine: trophy badges replace the four original trophies,
-- and level rewards can be claimed. Fix forward on dog_training_game (20261022120000).

-- unlocked_trophies now holds badge ids.
alter table public.dog_training_game drop constraint if exists dog_training_game_unlocked_trophies_check;
alter table public.dog_training_game add constraint dog_training_game_unlocked_trophies_check
  check (unlocked_trophies <@ array[
    'toxin_shield', 'recall_god', 'zen_master', 'street_fighter',
    'streak_warrior_3', 'streak_warrior_7', 'streak_legend_30'
  ]::text[]);

-- Level rewards the owner has claimed. Only rewards that exist in the app (src/features/gamification/
-- data/rewardsData.ts, AVAILABLE ones) can be claimed.
alter table public.dog_training_game add column claimed_rewards text[] not null default '{}'
  check (claimed_rewards <@ array[
    'feature-foundation', 'feature-habits', 'sound-lab', 'certificate-foundation',
    'whistle', 'profile-skin-tactical', 'certificate-grandmaster'
  ]::text[]);
