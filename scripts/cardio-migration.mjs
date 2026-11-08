import {writeFile,readFile} from 'node:fs/promises';
import {lifts} from '../src/strength.js';
const sql=await readFile('supabase/009_training_expansion.template','utf8');
await writeFile('supabase/009_training_expansion.sql',sql.replace('__CATALOG__',JSON.stringify(lifts).replaceAll("'","''")));
