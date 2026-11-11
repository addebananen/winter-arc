// Regenerates supabase/020_mobility_progressions.sql from the skill catalog so both stay identical.
import {readFile,writeFile} from 'node:fs/promises';
import {lifts} from '../src/strength.js';
import {mobilityUpdateIds} from '../src/skills.js';
const added=lifts.filter(e=>mobilityUpdateIds.has(e.id));
if(added.length!==mobilityUpdateIds.size)throw Error('Saknade skill-övningar i katalogen.');
await writeFile('supabase/020_mobility_progressions.sql',(await readFile('supabase/020_mobility_progressions.template','utf8')).replace('__CATALOG__',JSON.stringify(added).replaceAll("'","''")));
