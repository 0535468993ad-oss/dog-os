-- The streak badges were renamed in the app (streak_warrior_3/7, streak_legend_30 → flame_keeper_3/7/30,
-- src/features/gamification/data/badgesData.ts). The check from 20261022150000 still lists the old ids,
-- so the first upload holding a streak badge would fail with 23514. Fix forward: rename stored ids,
-- then allow exactly the badge ids the app writes.

alter table public.dog_training_game drop constraint if exists dog_training_game_unlocked_trophies_check;

update public.dog_training_game
set unlocked_trophies = array(
  select case badge
    when 'streak_warrior_3' then 'flame_keeper_3'
    when 'streak_warrior_7' then 'flame_keeper_7'
    when 'streak_legend_30' then 'flame_keeper_30'
    else badge
  end
  from unnest(unlocked_trophies) as badge
)
where unlocked_trophies && array['streak_warrior_3', 'streak_warrior_7', 'streak_legend_30']::text[];

alter table public.dog_training_game add constraint dog_training_game_unlocked_trophies_check
  check (unlocked_trophies <@ array[
    'toxin_shield', 'recall_god', 'zen_master', 'street_fighter',
    'flame_keeper_3', 'flame_keeper_7', 'flame_keeper_30'
  ]::text[]);
