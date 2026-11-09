// Regenerates supabase/014_core_mobility_catalog.sql from the client catalog so both stay identical.
import {readFile,writeFile} from 'node:fs/promises';
import {coreLifts} from '../src/strength-catalog-core.js';
await writeFile('supabase/014_core_mobility_catalog.sql',(await readFile('supabase/014_core_mobility_catalog.template','utf8')).replace('__CATALOG__',JSON.stringify(coreLifts).replaceAll("'","''")));
