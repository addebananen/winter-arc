// Regenerates supabase/021_straddle_basics.sql from the skill catalog so both stay identical.
import {readFile,writeFile} from 'node:fs/promises';
import {lifts} from '../src/strength.js';
import {straddleBaseIds} from '../src/skills.js';
const added=lifts.filter(e=>straddleBaseIds.has(e.id));
if(added.length!==straddleBaseIds.size)throw Error('Saknade skill-övningar i katalogen.');
await writeFile('supabase/021_straddle_basics.sql',(await readFile('supabase/021_straddle_basics.template','utf8')).replace('__CATALOG__',JSON.stringify(added).replaceAll("'","''")));
