// Database migrations this version of the app expects (file names in supabase/ without .sql).
// tests/schema.test.mjs checks that the list matches the folder, so add every new migration here.
export const MIGRATIONS=[
 '001_winter_arc',
 '002_training_season',
 '003_daily_integrity',
 '004_calendar_integrity',
 '005_effort_rewards',
 '006_music_course',
 '007_strength_hub',
 '008_squad_activity',
 '009_training_expansion',
 '010_skill_workouts',
 '011_training_streak',
 '012_skill_hold_units',
 '013_workout_time_and_set_types',
 '014_core_mobility_catalog',
 '015_skill_start_level',
 '016_friends',
 '017_member_profiles',
 '018_xp_rules',
 '019_warmup_sets',
 '020_mobility_progressions',
 '022_straddle_basics',
 '023_squad_avatars',
 '024_squad_workout_details',
 '024_straddle_research',
 '025_short_squad_codes',
 '026_late_habit_checkin',
 '027_friend_from_squad',
 '028_schema_status'
];

// Migrations the database is missing, or null while unknown (offline, or 028 not installed yet).
export function missing(installed){if(!Array.isArray(installed))return null;const have=new Set(installed);return MIGRATIONS.filter(n=>!have.has(n));}

export const label=n=>n.slice(0,3);
