import {readFile,writeFile} from 'node:fs/promises';
import {lifts} from '../src/strength.js';
await writeFile('supabase/010_skill_workouts.sql',(await readFile('supabase/010_skill_workouts.template','utf8')).replace('__CATALOG__',JSON.stringify(lifts).replaceAll("'","''")));
