-- Server-enforced daily identity, immutable history and verified XP definitions.
begin;
create or replace function public.arc_habit_meta(h jsonb) returns jsonb
language sql immutable set search_path=public,pg_temp as $$
 select value from jsonb_array_elements('[{"id":"habit-0","name":"Styrketräning","category":"strength","xp":40,"activity":"habit:0"},{"id":"habit-1","name":"Promenad","category":"health","xp":25,"activity":"habit:1"},{"id":"habit-2","name":"Läs en bok","category":"wisdom","xp":25,"activity":"habit:2"},{"id":"habit-3","name":"Bön & reflektion","category":"faith","xp":20,"activity":"habit:3"},{"id":"habit-4","name":"Fokus utan mobilen","category":"discipline","xp":30,"activity":"habit:4"},{"id":"habit-5","name":"Hör av dig till en vän","category":"social","xp":20,"activity":"habit:5"},{"id":"habit-6","name":"Drick vatten","category":"health","xp":20,"activity":"habit:6"},{"id":"habit-7","name":"Sov i tid","category":"health","xp":25,"activity":"habit:7"},{"id":"habit-8","name":"Löpning","category":"strength","xp":35,"activity":"habit:8"},{"id":"habit-9","name":"Rörlighet","category":"mobility","xp":20,"activity":"habit:9"},{"id":"habit-10","name":"Tacksamhetsjournal","category":"faith","xp":20,"activity":"habit:10"},{"id":"habit-11","name":"Kall avslutning på duschen","category":"discipline","xp":15,"activity":"habit:11"},{"id":"habit-12","name":"Meditation","category":"health","xp":20,"activity":"meditation"},{"id":"habit-13","name":"Studera något nytt","category":"wisdom","xp":30,"activity":"habit:13"},{"id":"habit-14","name":"En vänlig handling","category":"social","xp":20,"activity":"habit:14"},{"id":"habit-15","name":"Bibelstudie","category":"faith","xp":25,"activity":"habit:15"},{"id":"habit-16","name":"Städa din plats","category":"discipline","xp":15,"activity":"habit:16"},{"id":"habit-17","name":"Skärmfri morgon","category":"discipline","xp":25,"activity":"habit:17"},{"id":"habit-18","name":"Lugn andning","category":"health","xp":20,"activity":"breathing"},{"id":"habit-19","name":"En minuts andningspaus","category":"health","xp":10,"activity":"breathing"},{"id":"habit-20","name":"Kroppsskanning","category":"health","xp":20,"activity":"habit:20"},{"id":"habit-21","name":"Dagsljus på morgonen","category":"health","xp":20,"activity":"habit:21"},{"id":"habit-22","name":"Skärmfri kväll","category":"health","xp":25,"activity":"habit:22"},{"id":"habit-23","name":"Förbered morgondagen","category":"discipline","xp":20,"activity":"habit:23"},{"id":"habit-24","name":"Två minuters start","category":"discipline","xp":15,"activity":"habit:24"},{"id":"habit-25","name":"Min viktigaste uppgift","category":"discipline","xp":30,"activity":"habit:25"},{"id":"habit-26","name":"Ordning i rummet","category":"discipline","xp":20,"activity":"habit:26"},{"id":"habit-27","name":"Lär utan distraktion","category":"wisdom","xp":30,"activity":"habit:27"},{"id":"habit-28","name":"Aktiv återkallning","category":"wisdom","xp":25,"activity":"habit:28"},{"id":"habit-29","name":"Förklara en idé enkelt","category":"wisdom","xp":25,"activity":"habit:29"},{"id":"habit-30","name":"Läs vetenskap","category":"wisdom","xp":25,"activity":"habit:30"},{"id":"habit-31","name":"Lär dig ett nytt ord","category":"wisdom","xp":15,"activity":"habit:31"},{"id":"habit-32","name":"Huvudräkning","category":"wisdom","xp":20,"activity":"habit:32"},{"id":"habit-33","name":"Skriv en boksammanfattning","category":"wisdom","xp":25,"activity":"habit:33"},{"id":"habit-34","name":"Bibel: ett stycke, en tanke","category":"faith","xp":25,"activity":"habit:34"},{"id":"habit-35","name":"Stillhet utan skärm","category":"faith","xp":20,"activity":"habit:35"},{"id":"habit-36","name":"Bön för någon annan","category":"faith","xp":20,"activity":"habit:36"},{"id":"habit-37","name":"En vers att reflektera över","category":"faith","xp":20,"activity":"habit:37"},{"id":"habit-38","name":"Ett ärligt samtal","category":"social","xp":25,"activity":"habit:38"},{"id":"habit-39","name":"Säg ett konkret tack","category":"social","xp":20,"activity":"habit:39"},{"id":"habit-40","name":"Uppmuntra ditt squad","category":"social","xp":15,"activity":"habit:40"},{"id":"habit-41","name":"Gör något hjälpsamt","category":"social","xp":20,"activity":"habit:41"},{"id":"habit-42","name":"Armhävningspraktik","category":"strength","xp":25,"activity":"habit:42"},{"id":"habit-43","name":"Knäböjspraktik","category":"strength","xp":25,"activity":"habit:43"},{"id":"habit-44","name":"Hängpraktik","category":"strength","xp":20,"activity":"habit:44"},{"id":"habit-45","name":"Bålstabilitet","category":"strength","xp":25,"activity":"habit:45"},{"id":"habit-46","name":"Calisthenics-pass","category":"strength","xp":40,"activity":"habit:46"},{"id":"habit-47","name":"Lugn kondition","category":"strength","xp":30,"activity":"habit:47"},{"id":"habit-48","name":"Rörliga axlar","category":"mobility","xp":20,"activity":"habit:48"},{"id":"habit-49","name":"Höftmobilitet","category":"mobility","xp":20,"activity":"habit:49"},{"id":"habit-50","name":"Fotledsmobilitet","category":"mobility","xp":15,"activity":"habit:50"},{"id":"habit-51","name":"Mjuk morgonrörlighet","category":"mobility","xp":20,"activity":"habit:51"},{"id":"habit-52","name":"Bröstryggsrotation","category":"mobility","xp":15,"activity":"habit:52"},{"id":"habit-53","name":"Rörlighetspaus","category":"mobility","xp":15,"activity":"habit:53"},{"id":"habit-54","name":"Handskriven reflektion","category":"wisdom","xp":20,"activity":"habit:54"},{"id":"habit-55","name":"Planera veckans träning","category":"discipline","xp":20,"activity":"habit:55"},{"id":"habit-56","name":"Utomhus utan hörlurar","category":"health","xp":20,"activity":"habit:56"},{"id":"habit-57","name":"Vila med avsikt","category":"health","xp":20,"activity":"habit:57"},{"id":"habit-58","name":"Öva en kreativ färdighet","category":"wisdom","xp":25,"activity":"habit:58"},{"id":"habit-59","name":"Lyssna för att förstå","category":"social","xp":20,"activity":"habit:59"}]'::jsonb) t(value) where
 case when h->>'templateId' is not null then value->>'id'=h->>'templateId' else lower(value->>'name')=lower(trim(h->>'name')) end limit 1;
$$;
create or replace function public.arc_habit_key(h jsonb) returns text
language sql immutable set search_path=public,pg_temp as $$
 select coalesce(public.arc_habit_meta(h)->>'activity','custom:'||regexp_replace(lower(trim(h->>'name')),'\s+',' ','g'));
$$;
create or replace function public.arc_validate_state(p jsonb,old jsonb,day text) returns void
language plpgsql stable set search_path=public,pg_temp as $$
declare h jsonb;prior jsonb;meta jsonb;rec record;e record;c jsonb;claim record;required jsonb;expected jsonb;active jsonb;oldactive jsonb;s jsonb;previous jsonb;step jsonb;pgm jsonb;move jsonb;
 catalog jsonb='{"push-technique":{"id":"push-technique","stat":"Strength","name":"Kvalitet före antal","minutes":4,"xp":30,"icon":"dumbbell","prompt":"Välj en enkel armhävningsvariant. Gör 2 lugna omgångar med 5 repetitioner. Skriv vad som hjälpte dig behålla kontrollen.","category":"strength"},"legs-balance":{"id":"legs-balance","stat":"Strength","name":"Stadig grund","minutes":5,"xp":30,"icon":"dumbbell","prompt":"Gör 2 lugna omgångar med 8 anpassade knäböj. Ta stöd om du behöver och stanna i ett bekvämt djup.","category":"strength"},"core-form":{"id":"core-form","stat":"Strength","name":"Känn din bål","minutes":3,"xp":25,"icon":"shield","prompt":"Prova bird dog i korta, kontrollerade omgångar. Lägg märke till när du kan hålla balansen utan att hålla andan.","category":"strength"},"mobility-break":{"id":"mobility-break","stat":"Flexibility","name":"Bryt sittandet","minutes":3,"xp":20,"icon":"refresh","prompt":"Byt position och gör mjuka axelcirklar och höftfällningar. Välj rörelser som känns bekväma.","category":"mobility"},"mobility-explore":{"id":"mobility-explore","stat":"Flexibility","name":"Utforska ditt rörelseomfång","minutes":5,"xp":25,"icon":"compass","prompt":"Välj två rörelser från rörlighetspasset. Öva lugnt och notera hur det känns. Målet är kontroll, inte att pressa djupare.","category":"mobility"},"ankle-practice":{"id":"ankle-practice","stat":"Flexibility","name":"Från grunden","minutes":3,"xp":20,"icon":"mountain","prompt":"Öva mjuka fotledsgungningar med stöd. Jämför känslan mellan sidorna utan att tvinga fram samma rörelse.","category":"mobility"},"focus-sprint":{"id":"focus-sprint","stat":"Discipline","name":"En sak i taget","minutes":10,"xp":30,"icon":"bolt","prompt":"Välj en viktig uppgift, lägg undan mobilen och arbeta med bara den i tio minuter. Skriv vad du hann.","category":"discipline"},"meditation-notice":{"id":"meditation-notice","stat":"Discipline","name":"Lägg märke till, återvänd","minutes":5,"xp":25,"icon":"sun","prompt":"Sitt bekvämt. Lägg märke till andningen och återvänd vänligt när tankarna vandrar. Inga perfekta minuter krävs.","category":"discipline"},"make-easy":{"id":"make-easy","stat":"Discipline","name":"Gör morgondagen enkel","minutes":5,"xp":20,"icon":"list","prompt":"Förbered en sak som minskar tröskeln för en vana imorgon: en bok på kudden, kläder framme eller en undanlagd mobil.","category":"discipline"},"bible-context":{"id":"bible-context","stat":"Faith","name":"Läs med sammanhang","minutes":10,"xp":30,"icon":"book","prompt":"Läs ett kort bibelstycke och lite före och efter. Skriv vad sammanhanget hjälper dig förstå.","category":"faith"},"faith-practice":{"id":"faith-practice","stat":"Faith","name":"Från ord till handling","minutes":5,"xp":25,"icon":"sun","prompt":"Välj en tanke från dagens bibelläsning. Skriv en liten, konkret handling som kan uttrycka den idag.","category":"faith"},"faith-questions":{"id":"faith-questions","stat":"Faith","name":"En ärlig fråga","minutes":5,"xp":25,"icon":"book","prompt":"Läs en vers och skriv en fråga du faktiskt undrar över. Försök förstå innan du försöker formulera ett färdigt svar.","category":"faith"},"book-recall":{"id":"book-recall","stat":"Wisdom","name":"Stäng boken. Vad minns du?","minutes":5,"xp":25,"icon":"book","prompt":"Läs några sidor, stäng boken och skriv tre idéer du minns. Kontrollera sedan vad du missade.","category":"wisdom"},"feynman":{"id":"feynman","stat":"Wisdom","name":"Förklara utan fackspråk","minutes":8,"xp":30,"icon":"book","prompt":"Välj ett begrepp du lär dig. Förklara det som för någon som aldrig hört talas om det. Markera luckorna i din förklaring.","category":"wisdom"},"science-check":{"id":"science-check","stat":"Wisdom","name":"Ett påstående under lupp","minutes":10,"xp":35,"icon":"compass","prompt":"Välj ett vetenskapligt påstående. Hitta ursprungskällan och skriv vad den visar, vad den inte visar och en osäkerhet.","category":"wisdom"},"science-predict":{"id":"science-predict","stat":"Wisdom","name":"Gissa. Undersök. Uppdatera.","minutes":10,"xp":30,"icon":"bolt","prompt":"Skriv en förutsägelse om ett vardagligt fenomen. Läs en trovärdig förklaring och jämför den med din första tanke.","category":"wisdom"},"mental-math":{"id":"mental-math","stat":"Wisdom","name":"Fem små problem","minutes":5,"xp":20,"icon":"bolt","prompt":"Välj fem huvudräkningsuppgifter på din nivå. Lös dem utan miniräknare och förklara en av metoderna.","category":"wisdom"},"teach-squad":{"id":"teach-squad","stat":"Social","name":"Dela något användbart","minutes":5,"xp":25,"icon":"users","prompt":"Förklara en lärdom för en vän och fråga hur personen ser på den. Dela bara det du själv vill dela.","category":"social"},"specific-thanks":{"id":"specific-thanks","stat":"Social","name":"Ett tack med innehåll","minutes":3,"xp":20,"icon":"heart","prompt":"Tacka någon för något konkret och berätta varför det betydde något för dig.","category":"social"},"listen-first":{"id":"listen-first","stat":"Social","name":"Nyfiken före snabb","minutes":5,"xp":25,"icon":"users","prompt":"Ställ en öppen fråga till en vän och lyssna färdigt. Följ upp med en fråga istället för att direkt ge råd.","category":"social"}}';programs jsonb='{"first-step":{"id":"first-step","name":"Börja där du är","tag":"NYBÖRJARE","minutes":8,"kind":"strength","description":"En mjuk start med tre enkla kroppsviktsrörelser.","moves":[["wall-push",2,8],["chair-squat",2,8],["dead-bug",2,6]],"rest":40},"full-body":{"id":"full-body","name":"Bodyweight foundations","tag":"CALISTHENICS","minutes":15,"kind":"strength","description":"Press, ben och bål. Ett litet, komplett pass.","moves":[["push-up",2,6],["squat",2,10],["plank",2,20]],"rest":60},"pull-foundation":{"id":"pull-foundation","name":"Pull & control","tag":"STÅNG / RÄCKE","minutes":15,"kind":"strength","description":"Kontrollerad dragstyrka. Säker, fast förankrad utrustning krävs.","moves":[["assisted-pull",2,5],["row",2,8],["dead-hang",2,15]],"rest":75},"core-control":{"id":"core-control","name":"Stark från mitten","tag":"BÅL","minutes":10,"kind":"strength","description":"Stabilitet med lugn andning och korta omgångar.","moves":[["dead-bug",2,6],["bird-dog",2,6],["side-plank",2,15]],"rest":45},"mobility":{"id":"mobility","name":"Mer rörelsefrihet","tag":"FLEXIBILITY","minutes":7,"kind":"mobility","description":"Lugn rörelse för rygg, höft och fotleder.","moves":[["cat-cow",1,6],["thoracic",1,6],["hip-hinge",1,8],["ankle-rock",1,8]],"rest":20},"strong-legs":{"id":"strong-legs","name":"Stadigare steg","tag":"BEN","minutes":12,"kind":"strength","description":"Bygg stabilitet i ett kontrollerat tempo.","moves":[["squat",2,10],["reverse-lunge",2,6],["glute-bridge",2,10],["calf-raise",2,12]],"rest":60},"reset-move":{"id":"reset-move","name":"Tillbaka med ett steg","tag":"COMEBACK","minutes":3,"kind":"recovery","description":"En kort, anpassningsbar start. Ingen ökande bestraffning.","moves":[["wall-push",1,5],["chair-squat",1,5],["walk-reset",1,60]],"rest":20},"reset-mobility":{"id":"reset-mobility","name":"Starta mjukt igen","tag":"COMEBACK","minutes":4,"kind":"recovery","description":"Välj rörlighet när kroppen behöver en lugnare väg tillbaka.","moves":[["shoulder-circle",1,6],["cat-cow",1,6],["breathing",1,60]],"rest":15},"reset-calm":{"id":"reset-calm","name":"En lugn omstart","tag":"COMEBACK","minutes":2,"kind":"recovery","description":"Sitt bekvämt och följ några lugna andetag.","moves":[["breathing",1,120]],"rest":0}}';exercise_ids jsonb='["wall-push","incline-push","knee-push","push-up","close-push","pike-push","chair-squat","squat","split-squat","reverse-lunge","calf-raise","glute-bridge","dead-bug","bird-dog","plank","side-plank","hollow-hold","dead-hang","assisted-pull","pull-up","row","thoracic","cat-cow","ankle-rock","hip-hinge","shoulder-circle","breathing","walk-reset"]';v_kind text;v_date text;v_count integer;v_now numeric=extract(epoch from now())*1000;v_index integer;
begin
 old=coalesce(old,'{}');
 -- A past day's scoring record cannot be created, edited or removed by the browser.
 for rec in select key,value from jsonb_each(coalesce(p->'history','{}')) loop
   if rec.key<>day and old->'history'->rec.key is distinct from rec.value then raise exception 'Tidigare dagars resultat är låsta.';end if;
 end loop;
 for rec in select key,value from jsonb_each(coalesce(old->'history','{}')) loop
   if rec.key<>day and p->'history'->rec.key is distinct from rec.value then raise exception 'Tidigare dagars resultat är låsta.';end if;
 end loop;
 if jsonb_array_length(p->'habits')>200 or (select count(*) from jsonb_array_elements(p->'habits') x where not coalesce((x->>'archived')::boolean,false))>20 then raise exception 'Högst 20 aktiva vanor.';end if;
 if exists(select 1 from jsonb_array_elements(p->'habits') x group by x->>'id' having count(*)>1) then raise exception 'Duplicerad vana.';end if;
 if exists(select 1 from jsonb_array_elements(p->'habits') x where not coalesce((x->>'archived')::boolean,false) group by public.arc_habit_key(x) having count(*)>1) then raise exception 'Samma aktivitet räknas bara en gång per dag.';end if;
 for h in select value from jsonb_array_elements(p->'habits') loop
   meta=public.arc_habit_meta(h);
   if length(coalesce(h->>'id','')) not between 1 and 100 or length(trim(coalesce(h->>'name',''))) not between 1 and 70 or h->>'category' not in ('strength','mobility','health','discipline','wisdom','faith','social') or (h->>'target')::numeric not between 1 and 100000 or jsonb_typeof(h->'days') is distinct from 'array' or jsonb_array_length(h->'days') not between 1 and 7 then raise exception 'Ogiltig vana.';end if;
   if h->>'templateId' is not null and meta is null then raise exception 'Okänd biblioteksaktivitet.';end if;
   if (h->>'xp')::numeric<>coalesce((meta->>'xp')::numeric,15) or h->>'activityKey' is distinct from public.arc_habit_key(h) or (meta is not null and h->>'category' is distinct from meta->>'category') then raise exception 'XP och stat bestäms av aktivitetens definition.';end if;
   select value into prior from jsonb_array_elements(coalesce(old->'habits','[]')) x(value) where value->>'id'=h->>'id';
   if prior is null and h->>'start'<greatest(day,p#>>'{expedition,start}') then raise exception 'Nya vanor kan inte bakdateras.';end if;
   if prior is not null then
     if public.arc_habit_meta(prior) is not null and public.arc_habit_key(prior)<>public.arc_habit_key(h) then raise exception 'En biblioteksaktivitet kan inte byta identitet.';end if;
     if prior->>'start' is distinct from h->>'start' and h->>'start'<>greatest(prior->>'start',p#>>'{expedition,start}') then raise exception 'Vanans start är låst.';end if;
     if day>=prior->>'start' and not coalesce((prior->>'archived')::boolean,false) and prior->'days' @> to_jsonb(array[extract(dow from day::date)::integer]) then
       if prior->>'pendingDate'<=day then prior=prior||(prior->'pending');end if;
       if prior->'target' is distinct from h->'target' or prior->'days' is distinct from h->'days' then raise exception 'Dagens mål är låst. Ändringar gäller från nästa dag.';end if;
     end if;
   end if;
 end loop;
 for h in select value from jsonb_array_elements(coalesce(old->'habits','[]')) loop
   if not exists(select 1 from jsonb_array_elements(p->'habits') x where x->>'id'=h->>'id') then raise exception 'Arkivera vanan för att behålla historiken.';end if;
 end loop;
 if p->'history' ? day then
   if exists(select 1 from jsonb_each(p->'history'->day->'entries') z where coalesce(z.value->>'source','habit')<>'challenge' group by z.value->>'activityKey' having count(*)>1) then raise exception 'Samma aktivitet får bara en registrering per dag, även efter arkivering.';end if;
   for e in select key,value from jsonb_each(p->'history'->day->'entries') loop
     if e.value->>'source'='challenge' then
       c=catalog->substr(e.key,11);
       if c is null or e.key<>'challenge:'||(c->>'id') or e.value->>'xp'<>c->>'xp' or e.value->>'category'<>c->>'category' or (e.value->>'target')::numeric<>1 or (e.value->>'value')::numeric<>1 or length(trim(coalesce(e.value->>'note',''))) not between 1 and 1200 then raise exception 'Ogiltig utmaning eller XP-definition.';end if;
       if old->'history'->day->'entries' ? e.key and old->'history'->day->'entries'->e.key is distinct from e.value then raise exception 'Utmaningen är redan registrerad idag.';end if;
     else
       select value into h from jsonb_array_elements(p->'habits') x(value) where value->>'id'=e.key;
       if h is null or e.value->'xp' is distinct from h->'xp' or e.value->'target' is distinct from h->'target' or e.value->'category' is distinct from h->'category' or e.value->>'activityKey' is distinct from public.arc_habit_key(h) then raise exception 'Registreringen måste följa vanans låsta mål och XP.';end if;
     end if;
   end loop;
   select coalesce(jsonb_agg(id order by id),'[]') into expected from (
     select distinct x->>'id' id from jsonb_array_elements(p->'habits') x where
       (not coalesce((x->>'archived')::boolean,false) and day>=x->>'start' and day>=p#>>'{expedition,start}' and x->'days' @> to_jsonb(array[extract(dow from day::date)::integer]))
       or (old->'history'->day->'required' ? (x->>'id') and (p->'history'->day->'entries'->(x->>'id')->>'value')::numeric >= (p->'history'->day->'entries'->(x->>'id')->>'target')::numeric)
   ) q;
   select coalesce(jsonb_agg(value order by value),'[]') into required from jsonb_array_elements(p->'history'->day->'required');
   if required<>expected then raise exception 'Dagens krav får inte tas bort eller dupliceras.';end if;
 end if;
 -- Sessions are append-only. A saved exercise may occur only once on a calendar day.
 for s in select value from jsonb_array_elements(coalesce(old#>'{training,sessions}','[]')) loop
   select value into previous from jsonb_array_elements(coalesce(p#>'{training,sessions}','[]')) x(value) where value->>'id'=s->>'id';
   if previous is distinct from s then raise exception 'Sparade träningspass är låsta.';end if;
 end loop;
 if exists(select 1 from jsonb_array_elements(coalesce(p#>'{training,sessions}','[]')) x group by x->>'id' having count(*)>1) then raise exception 'Duplicerat träningspass.';end if;
 if exists(select 1 from jsonb_array_elements(coalesce(p#>'{training,sessions}','[]')) ses cross join lateral jsonb_array_elements(ses->'exercises') x where exists(select 1 from jsonb_array_elements(x->'done') n where n::text::numeric>0) group by ses->>'date',x->>'id' having count(*)>1) then raise exception 'Varje övning kan sparas en gång per dag.';end if;
 oldactive=old#>'{training,active}';active=p#>'{training,active}';
 for s in select value from jsonb_array_elements(coalesce(p#>'{training,sessions}','[]')) x(value) where not exists(select 1 from jsonb_array_elements(coalesce(old#>'{training,sessions}','[]')) o where o->>'id'=x.value->>'id') loop
   if s->>'date'<>day or oldactive->>'id' is distinct from s->>'id' or s->'startedAt' is distinct from oldactive->'startedAt' or s->'programId' is distinct from oldactive->'programId' or s->'kind' is distinct from oldactive->'kind' or abs((s->>'finishedAt')::numeric-v_now)>120000 then raise exception 'Starta och spara passet i rätt ordning, idag.';end if;
   if s->>'kind'='breathing' then
     if v_now-(oldactive->>'startedAt')::numeric<60000 or (s#>>'{exercises,0,done,0}')::numeric<60 or (s#>>'{exercises,0,done,0}')::numeric>least(300,floor((v_now-(oldactive->>'startedAt')::numeric)/1000)) then raise exception 'Andningsövningen behöver minst en verklig minut.';end if;
   elsif s->'exercises' is distinct from oldactive->'exercises' then raise exception 'Registrera dina set innan du avslutar.';end if;
 end loop;
 if active is not null and active<>'null'::jsonb then
   if active->>'date'<>day and active->>'id' is distinct from oldactive->>'id' then raise exception 'Ett nytt pass måste börja idag.';end if;
   if active->>'id'=oldactive->>'id' then
     if active->'startedAt' is distinct from oldactive->'startedAt' or active->'programId' is distinct from oldactive->'programId' or active->'kind' is distinct from oldactive->'kind' then raise exception 'Passets identitet och starttid är låsta.';end if;
   elsif abs((active->>'startedAt')::numeric-v_now)>120000 then raise exception 'Passets starttid måste vara nu.';end if;
   if jsonb_array_length(active->'exercises') not between 1 and 6 then raise exception 'Välj 1–6 övningar.';end if;
   pgm=programs->(active->>'programId');
   if active->>'kind'='recovery' and (pgm is null or pgm->>'kind'<>'recovery') then raise exception 'Välj ett definierat comeback-pass.';end if;
   v_index=0;
   for step in select value from jsonb_array_elements(active->'exercises') loop
     if not exercise_ids ? (step->>'id') or (step->>'sets')::integer not between 1 and 3 or jsonb_array_length(step->'done')>(step->>'sets')::integer then raise exception 'Ogiltig övning eller antal set.';end if;
     if pgm is not null then move=pgm->'moves'->v_index;if move->>0 is distinct from step->>'id' or (move->>1)::integer<>(step->>'sets')::integer then raise exception 'Passet måste följa sin övningsdefinition.';end if;end if;
     v_index=v_index+1;
   end loop;
   if pgm is not null and v_index<>jsonb_array_length(pgm->'moves') then raise exception 'Passet saknar övningar.';end if;
 end if;
 for claim in select key,value from jsonb_each(coalesce(p->'claims','{}')) loop
   if old->'claims'->claim.key=claim.value and claim.value->>'date'<>day then continue;end if;
   v_kind=split_part(claim.key,':',1);v_date=claim.value->>'date';
   if v_date<>day or day<p#>>'{expedition,start}' then raise exception 'Bonus kan bara hämtas för dagens giltiga uppdrag.';end if;
   v_count=public.arc_day_done(p->'history'->day);
   if v_kind='three' and claim.key='three:'||day and (claim.value->>'xp')::numeric=50 and v_count>=3 then continue;end if;
   if v_kind='perfect' and claim.key='perfect:'||day and (claim.value->>'xp')::numeric=100 and public.arc_perfect(p->'history'->day) then continue;end if;
   if v_kind='reflect' and claim.key='reflect:'||date_trunc('week',day::date)::date::text and (claim.value->>'xp')::numeric=75 and exists(select 1 from jsonb_array_elements(p->'reflections') x where date_trunc('week',(x->>'date')::date)=date_trunc('week',day::date)) then continue;end if;
   if v_kind='comeback' and claim.key='comeback:'||day and (claim.value->>'xp')::numeric=40 and (day::date-1)::text>=p#>>'{expedition,start}' and (case when p->'history' ? (day::date-1)::text then jsonb_array_length(coalesce(p->'history'->(day::date-1)::text->'required','[]'))>0 else exists(select 1 from jsonb_array_elements(p->'habits') hh where not coalesce((hh->>'archived')::boolean,false) and hh->>'start'<day and hh->'days' @> to_jsonb(array[extract(dow from day::date-1)::integer])) end) and not public.arc_perfect(p->'history'->(day::date-1)::text) and (v_count>=2 or exists(select 1 from jsonb_array_elements(coalesce(p#>'{training,sessions}','[]')) x where x->>'date'=day and x->>'kind'='recovery' and not exists(select 1 from jsonb_array_elements(x->'exercises') ex where not exists(select 1 from jsonb_array_elements(ex->'done') n where n::text::numeric>0)))) then continue;end if;
   raise exception 'Uppdragets krav eller XP stämmer inte.';
 end loop;
end;
$$;
create or replace function public.save_arc_state(p_payload jsonb,p_expected_revision bigint) returns bigint
language plpgsql security definer set search_path=public,pg_temp as $$
declare v_old jsonb; v_revision bigint; v_name text; v_tz text; v_today text; v_start text; v_created text; h record; e record; s jsonb; step jsonb; actual jsonb;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if pg_column_size(p_payload)>1500000 then raise exception 'Your journal is too large. Export it before continuing.'; end if;
 if jsonb_typeof(p_payload) is distinct from 'object' or p_payload->>'version' is distinct from '1'
   or jsonb_typeof(p_payload->'habits') is distinct from 'array' or jsonb_typeof(p_payload->'history') is distinct from 'object'
   or jsonb_typeof(p_payload->'body') is distinct from 'array' or jsonb_typeof(p_payload->'claims') is distinct from 'object'
   or jsonb_typeof(p_payload->'goals') is distinct from 'array' or jsonb_typeof(p_payload->'reflections') is distinct from 'array'
   or jsonb_typeof(p_payload->'rewards') is distinct from 'array' then raise exception 'Invalid state'; end if;
 v_name=trim(p_payload#>>'{profile,name}');
 if v_name is null or length(v_name) not between 1 and 40 then raise exception 'Invalid profile name'; end if;
 v_tz=p_payload->>'timezone';
 if not exists(select 1 from pg_timezone_names where name=v_tz) then raise exception 'Invalid timezone'; end if;
 v_today=(now() at time zone v_tz)::date::text;
 select (created_at at time zone v_tz)::date::text into v_created from auth.users where id=auth.uid();
 v_start=greatest('2026-11-09',v_created);
 p_payload=jsonb_set(p_payload,'{expedition,start}',to_jsonb(v_start));
 p_payload=jsonb_set(p_payload,'{accountCreated}',to_jsonb(v_created));
 if p_payload ? 'training' then
   if jsonb_typeof(p_payload#>'{training,sessions}') is distinct from 'array' or jsonb_typeof(p_payload#>'{training,plans}') is distinct from 'array' then raise exception 'Invalid training journal';end if;
   if jsonb_array_length(p_payload#>'{training,sessions}')>5000 or jsonb_array_length(p_payload#>'{training,plans}')>30 then raise exception 'Training journal limit reached';end if;
   for s in select value from jsonb_array_elements(p_payload#>'{training,sessions}') loop
     if length(coalesce(s->>'id','')) not between 1 and 100 or s->>'date' !~ '^\d{4}-\d{2}-\d{2}$' or s->>'date'>v_today or jsonb_typeof(s->'exercises') is distinct from 'array' or jsonb_array_length(s->'exercises') not between 1 and 6 or jsonb_typeof(s->'finishedAt') is distinct from 'number' then raise exception 'Invalid training session';end if;
     for step in select value from jsonb_array_elements(s->'exercises') loop
       if jsonb_typeof(step->'done') is distinct from 'array' or jsonb_array_length(step->'done')>3 then raise exception 'Invalid training sets';end if;
       for actual in select value from jsonb_array_elements(step->'done') loop
         if jsonb_typeof(actual) is distinct from 'number' or actual::text::numeric not between 0 and 600 then raise exception 'Invalid training amount';end if;
       end loop;
     end loop;
   end loop;
 end if;

 for h in select key,value from jsonb_each(p_payload->'history') loop
   if h.key !~ '^\d{4}-\d{2}-\d{2}$' or h.key>v_today or jsonb_typeof(h.value->'entries') is distinct from 'object' or jsonb_typeof(h.value->'required') is distinct from 'array' then raise exception 'Invalid daily history'; end if;
   for e in select key,value from jsonb_each(h.value->'entries') loop
     if jsonb_typeof(e.value->'value') is distinct from 'number' or jsonb_typeof(e.value->'target') is distinct from 'number' or jsonb_typeof(e.value->'xp') is distinct from 'number' then raise exception 'Invalid daily progress'; end if;
     if (e.value->>'target')::numeric<=0 or (e.value->>'target')::numeric>100000 or (e.value->>'value')::numeric<0 or (e.value->>'value')::numeric>(e.value->>'target')::numeric or (e.value->>'xp')::numeric not between 1 and 40 then raise exception 'Invalid daily values'; end if;
   end loop;
 end loop;
 if exists(select 1 from jsonb_array_elements(p_payload->'body') b where b->>'photo' is not null and b->>'photo' not like auth.uid()::text||'/body/%') then raise exception 'Invalid private image reference'; end if;
 select payload into v_old from public.user_states where user_id=auth.uid();
 if p_payload#>>'{training,active,id}' is not null and p_payload#>>'{training,active,id}' is distinct from v_old#>>'{training,active,id}' then
   p_payload=jsonb_set(p_payload,'{training,active,startedAt}',to_jsonb(floor(extract(epoch from clock_timestamp())*1000)));
 end if;
 perform public.arc_validate_state(p_payload,v_old,v_today);
 if p_expected_revision=0 then
   insert into public.user_states(user_id,payload) values(auth.uid(),p_payload) on conflict do nothing returning revision into v_revision;
 else
   update public.user_states set payload=p_payload,revision=revision+1,updated_at=now() where user_id=auth.uid() and revision=p_expected_revision returning revision into v_revision;
 end if;
 if v_revision is null then raise exception 'Revision conflict. Refresh before saving.'; end if;
 insert into public.profiles(id,display_name) values(auth.uid(),v_name) on conflict(id) do update set display_name=excluded.display_name;
 return v_revision;
end;
$$;


create or replace function public.arc_day_xp(p_day jsonb) returns numeric
language sql immutable set search_path=public,pg_temp as $$
 select round(least(200,coalesce(sum(least(40,greatest(0,(e.value->>'xp')::numeric))) filter(where coalesce(e.value->>'source','habit')<>'challenge'),0))
 *case when public.arc_day_done(p_day)>=5 then 1.5 when public.arc_day_done(p_day)>=3 then 1.2 else 1 end)
 +least(100,coalesce(sum(greatest(0,least(40,(e.value->>'xp')::numeric)-case when e.key='challenge:meditation-notice' then coalesce((select sum((mm.value->>'xp')::numeric) from jsonb_each(coalesce(p_day->'entries','{}')) mm where mm.value->>'activityKey'='meditation' and (mm.value->>'value')::numeric>=(mm.value->>'target')::numeric),0) else 0 end)) filter(where e.value->>'source'='challenge'),0))
 from jsonb_each(coalesce(p_day->'entries','{}')) e where (e.value->>'value')::numeric >= (e.value->>'target')::numeric;
$$;
create or replace function public.arc_training_xp(p_payload jsonb,p_until text) returns bigint
language plpgsql immutable set search_path=public,pg_temp as $$
declare s jsonb; step jsonb; actual jsonb; meta jsonb; catalog jsonb='{"wall-push":[6,8,40],"incline-push":[8,8,40],"knee-push":[8,8,40],"push-up":[10,8,40],"close-push":[12,6,40],"pike-push":[12,6,40],"chair-squat":[6,8,40],"squat":[8,10,40],"split-squat":[10,6,40],"reverse-lunge":[10,6,40],"calf-raise":[6,12,40],"glute-bridge":[7,10,40],"dead-bug":[7,6,40],"bird-dog":[7,6,40],"plank":[8,20,600],"side-plank":[9,15,600],"hollow-hold":[10,15,600],"dead-hang":[8,15,600],"assisted-pull":[10,5,40],"pull-up":[14,5,40],"row":[10,8,40],"thoracic":[6,6,40],"cat-cow":[5,6,40],"ankle-rock":[5,8,40],"hip-hinge":[6,8,40],"shoulder-circle":[5,8,40],"breathing":[20,300,600],"walk-reset":[6,120,600]}';
 seen text[]='{}';days jsonb='{}';d record;v_date text;v_amount numeric;v_points numeric;v_train numeric;v_breath numeric;v_total numeric;v_factor numeric;total numeric=0;
begin
 for s in select value from jsonb_array_elements(coalesce(p_payload#>'{training,sessions}','[]')) loop
   v_date=s->>'date';
   if s->>'id' is null or s->>'id'=any(seen) or coalesce((s->>'finishedAt')::numeric,0)<=0 or v_date is null or v_date<coalesce(p_payload#>>'{expedition,start}','2026-11-09') or v_date>p_until then continue;end if;
   seen=array_append(seen,s->>'id');v_train=0;v_breath=0;
   for step in select value from jsonb_array_elements(coalesce(s->'exercises','[]')) with ordinality e(value,n) where n<=6 loop
     meta=catalog->(step->>'id');if meta is null then continue;end if;
     for actual in select value from jsonb_array_elements(coalesce(step->'done','[]')) with ordinality e(value,n) where n<=3 loop
       v_amount=least((actual::text)::numeric,(meta->>2)::numeric);if v_amount<=0 then continue;end if;
       v_points=round((meta->>0)::numeric*least(v_amount/(meta->>1)::numeric,1.5));
       if step->>'id'='breathing' then v_breath=v_breath+v_points;else v_train=v_train+v_points;end if;
     end loop;
   end loop;
   v_total=v_train+v_breath;
   if v_total>80 then v_factor=80/v_total;v_train=floor(v_train*v_factor);v_breath=80-v_train;end if;
   days=jsonb_set(days,array[v_date],jsonb_build_object('training',coalesce((days->v_date->>'training')::numeric,0)+v_train,'breath',coalesce((days->v_date->>'breath')::numeric,0)+v_breath));
 end loop;
 for d in select key,value from jsonb_each(days) loop total=total+least(120,(d.value->>'training')::numeric+greatest(0,least(20,(d.value->>'breath')::numeric)-coalesce((select sum((ee.value->>'xp')::numeric) from jsonb_each(coalesce(p_payload->'history'->d.key->'entries','{}')) ee where ee.value->>'activityKey'='breathing' and (ee.value->>'value')::numeric>=(ee.value->>'target')::numeric),0)));end loop;
 return total::bigint;
end;
$$;

create or replace function public.save_arc_state_v3(p_payload jsonb,p_expected_revision bigint) returns jsonb
language plpgsql security definer set search_path=public,pg_temp as $$
declare rev bigint;result jsonb;
begin
 rev=public.save_arc_state(p_payload,p_expected_revision);
 select jsonb_build_object('revision',revision,'payload',payload) into result from public.user_states where user_id=auth.uid();
 return result;
end;
$$;
revoke all on function public.save_arc_state_v3(jsonb,bigint) from public,anon,authenticated;
grant execute on function public.save_arc_state_v3(jsonb,bigint) to authenticated;

revoke all on function public.arc_habit_meta(jsonb),public.arc_habit_key(jsonb),public.arc_validate_state(jsonb,jsonb,text) from public,anon,authenticated;
commit;
