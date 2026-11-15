import test from 'node:test';
import assert from 'node:assert/strict';
import {readdir} from 'node:fs/promises';
import * as SC from '../src/schema.js';

test('the app knows every migration file in supabase/',async()=>{const files=(await readdir(new URL('../supabase/',import.meta.url))).filter(f=>f.endsWith('.sql')).map(f=>f.slice(0,-4)).sort();assert.deepEqual(SC.MIGRATIONS,files);});
test('missing lists what the database lacks, null while unknown',()=>{assert.equal(SC.missing(null),null);assert.deepEqual(SC.missing(SC.MIGRATIONS),[]);assert.deepEqual(SC.missing(SC.MIGRATIONS.filter(n=>n!=='026_late_habit_checkin')),['026_late_habit_checkin']);assert.equal(SC.label('026_late_habit_checkin'),'026');});
test('migrations from 028 on record themselves in schema_migrations',async()=>{const {readFile}=await import('node:fs/promises');for(const n of SC.MIGRATIONS.filter(n=>n>='028')){const sql=await readFile(new URL(`../supabase/${n}.sql`,import.meta.url),'utf8');assert.match(sql,new RegExp(`insert into public\\.schema_migrations\\(name\\) values\\('${n}'\\)`),n);}});
