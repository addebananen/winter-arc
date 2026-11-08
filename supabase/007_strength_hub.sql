-- Additive release: preserve all account rows, history and revisions.
begin;
create or replace function public.arc_day_xp_v6(p_day jsonb) returns numeric
language sql immutable set search_path=public,pg_temp as $$
 with entries as (select key,value from jsonb_each(coalesce(p_day->'entries','{}')) where (value->>'value')::numeric >= (value->>'target')::numeric),
 amounts as (select
 coalesce(sum(least(40,greatest(0,(value->>'xp')::numeric))) filter(where coalesce(value->>'source','habit')<>'challenge'),0) as habit,
 coalesce(sum((value->>'xp')::numeric) filter(where coalesce(value->>'source','habit')<>'challenge' and value->>'category'='music'),0) as music_habit,
 coalesce(sum((value->>'xp')::numeric) filter(where value->>'activityKey'='meditation' and coalesce(value->>'source','habit')<>'challenge'),0) as meditation,
 coalesce(sum(least(40,(value->>'xp')::numeric)) filter(where value->>'source'='challenge' and value->>'category'='music'),0) as music_course
 from entries)
 select round(least(200,a.habit)*case when public.arc_day_done(p_day)>=5 then 1.5 when public.arc_day_done(p_day)>=3 then 1.2 else 1 end)
 +least(100,greatest(0,a.music_course-a.music_habit)+coalesce((select sum(greatest(0,least(40,(e.value->>'xp')::numeric)-case when e.key='challenge:meditation-notice' then a.meditation else 0 end)) from entries e where e.value->>'source'='challenge' and e.value->>'category'<>'music'),0)) from amounts a;
$$;


create or replace function public.arc_validate_state(p jsonb,old jsonb,day text) returns void
language plpgsql stable set search_path=public,pg_temp as $$
declare h jsonb;prior jsonb;meta jsonb;rec record;e record;c jsonb;claim record;required jsonb;expected jsonb;active jsonb;oldactive jsonb;s jsonb;previous jsonb;step jsonb;pgm jsonb;move jsonb;
 catalog jsonb='{"push-technique":{"id":"push-technique","stat":"Strength","name":"Kvalitet före antal","minutes":4,"xp":30,"icon":"dumbbell","prompt":"Välj en enkel armhävningsvariant. Gör 2 lugna omgångar med 5 repetitioner. Skriv vad som hjälpte dig behålla kontrollen.","category":"strength"},"legs-balance":{"id":"legs-balance","stat":"Strength","name":"Stadig grund","minutes":5,"xp":30,"icon":"dumbbell","prompt":"Gör 2 lugna omgångar med 8 anpassade knäböj. Ta stöd om du behöver och stanna i ett bekvämt djup.","category":"strength"},"core-form":{"id":"core-form","stat":"Strength","name":"Känn din bål","minutes":3,"xp":25,"icon":"shield","prompt":"Prova bird dog i korta, kontrollerade omgångar. Lägg märke till när du kan hålla balansen utan att hålla andan.","category":"strength"},"mobility-break":{"id":"mobility-break","stat":"Flexibility","name":"Bryt sittandet","minutes":3,"xp":20,"icon":"refresh","prompt":"Byt position och gör mjuka axelcirklar och höftfällningar. Välj rörelser som känns bekväma.","category":"mobility"},"mobility-explore":{"id":"mobility-explore","stat":"Flexibility","name":"Utforska ditt rörelseomfång","minutes":5,"xp":25,"icon":"compass","prompt":"Välj två rörelser från rörlighetspasset. Öva lugnt och notera hur det känns. Målet är kontroll, inte att pressa djupare.","category":"mobility"},"ankle-practice":{"id":"ankle-practice","stat":"Flexibility","name":"Från grunden","minutes":3,"xp":20,"icon":"mountain","prompt":"Öva mjuka fotledsgungningar med stöd. Jämför känslan mellan sidorna utan att tvinga fram samma rörelse.","category":"mobility"},"focus-sprint":{"id":"focus-sprint","stat":"Discipline","name":"En sak i taget","minutes":10,"xp":30,"icon":"bolt","prompt":"Välj en viktig uppgift, lägg undan mobilen och arbeta med bara den i tio minuter. Skriv vad du hann.","category":"discipline"},"meditation-notice":{"id":"meditation-notice","stat":"Discipline","name":"Lägg märke till, återvänd","minutes":5,"xp":25,"icon":"sun","prompt":"Sitt bekvämt. Lägg märke till andningen och återvänd vänligt när tankarna vandrar. Inga perfekta minuter krävs.","category":"discipline"},"make-easy":{"id":"make-easy","stat":"Discipline","name":"Gör morgondagen enkel","minutes":5,"xp":20,"icon":"list","prompt":"Förbered en sak som minskar tröskeln för en vana imorgon: en bok på kudden, kläder framme eller en undanlagd mobil.","category":"discipline"},"bible-context":{"id":"bible-context","stat":"Faith","name":"Läs med sammanhang","minutes":10,"xp":30,"icon":"book","prompt":"Läs ett kort bibelstycke och lite före och efter. Skriv vad sammanhanget hjälper dig förstå.","category":"faith"},"faith-practice":{"id":"faith-practice","stat":"Faith","name":"Från ord till handling","minutes":5,"xp":25,"icon":"sun","prompt":"Välj en tanke från dagens bibelläsning. Skriv en liten, konkret handling som kan uttrycka den idag.","category":"faith"},"faith-questions":{"id":"faith-questions","stat":"Faith","name":"En ärlig fråga","minutes":5,"xp":25,"icon":"book","prompt":"Läs en vers och skriv en fråga du faktiskt undrar över. Försök förstå innan du försöker formulera ett färdigt svar.","category":"faith"},"book-recall":{"id":"book-recall","stat":"Wisdom","name":"Stäng boken. Vad minns du?","minutes":5,"xp":25,"icon":"book","prompt":"Läs några sidor, stäng boken och skriv tre idéer du minns. Kontrollera sedan vad du missade.","category":"wisdom"},"feynman":{"id":"feynman","stat":"Wisdom","name":"Förklara utan fackspråk","minutes":8,"xp":30,"icon":"book","prompt":"Välj ett begrepp du lär dig. Förklara det som för någon som aldrig hört talas om det. Markera luckorna i din förklaring.","category":"wisdom"},"science-check":{"id":"science-check","stat":"Wisdom","name":"Ett påstående under lupp","minutes":10,"xp":35,"icon":"compass","prompt":"Välj ett vetenskapligt påstående. Hitta ursprungskällan och skriv vad den visar, vad den inte visar och en osäkerhet.","category":"wisdom"},"science-predict":{"id":"science-predict","stat":"Wisdom","name":"Gissa. Undersök. Uppdatera.","minutes":10,"xp":30,"icon":"bolt","prompt":"Skriv en förutsägelse om ett vardagligt fenomen. Läs en trovärdig förklaring och jämför den med din första tanke.","category":"wisdom"},"mental-math":{"id":"mental-math","stat":"Wisdom","name":"Fem små problem","minutes":5,"xp":20,"icon":"bolt","prompt":"Välj fem huvudräkningsuppgifter på din nivå. Lös dem utan miniräknare och förklara en av metoderna.","category":"wisdom"},"teach-squad":{"id":"teach-squad","stat":"Social","name":"Dela något användbart","minutes":5,"xp":25,"icon":"users","prompt":"Förklara en lärdom för en vän och fråga hur personen ser på den. Dela bara det du själv vill dela.","category":"social"},"specific-thanks":{"id":"specific-thanks","stat":"Social","name":"Ett tack med innehåll","minutes":3,"xp":20,"icon":"heart","prompt":"Tacka någon för något konkret och berätta varför det betydde något för dig.","category":"social"},"listen-first":{"id":"listen-first","stat":"Social","name":"Nyfiken före snabb","minutes":5,"xp":25,"icon":"users","prompt":"Ställ en öppen fråga till en vän och lyssna färdigt. Följ upp med en fråga istället för att direkt ge råd.","category":"social"},"music-theory-1":{"id":"music-theory-1","stat":"Music","name":"Noterna på kartan","minutes":15,"xp":25,"icon":"music","prompt":"Läs och hitta C–D–E–F–G–A–B. Här används internationella tonnamn: B motsvarar svenskt H.","category":"music"},"music-ear-1":{"id":"music-ear-1","stat":"Music","name":"Lyssna på riktningen","minutes":20,"xp":30,"icon":"music","prompt":"Skilj på uppåt, nedåt och samma ton innan du namnger intervall.","category":"music"},"music-voice-1":{"id":"music-voice-1","stat":"Music","name":"En bekväm start","minutes":5,"xp":15,"icon":"music","prompt":"Lär känna hur en lätt röst känns idag.","category":"music"},"music-theory-2":{"id":"music-theory-2","stat":"Music","name":"Halvtoner och puls","minutes":15,"xp":25,"icon":"music","prompt":"Koppla tonavstånd till klaviaturen och rytm till ett jämnt slag.","category":"music"},"music-ear-2":{"id":"music-ear-2","stat":"Music","name":"Sekunder och terser","minutes":20,"xp":30,"icon":"music","prompt":"Hör små avstånd tydligare.","category":"music"},"music-voice-2":{"id":"music-voice-2","stat":"Music","name":"Läpptrill och lätt flöde","minutes":5,"xp":15,"icon":"music","prompt":"Utforska en avslappnad uppvärmning.","category":"music"},"music-theory-3":{"id":"music-theory-3","stat":"Music","name":"Dur och naturlig moll","minutes":20,"xp":30,"icon":"music","prompt":"Bygg skalor med hel- och halvtonssteg.","category":"music"},"music-ear-3":{"id":"music-ear-3","stat":"Music","name":"Kvart, kvint och oktav","minutes":20,"xp":30,"icon":"music","prompt":"Skilj rena intervall från terser.","category":"music"},"music-voice-3":{"id":"music-voice-3","stat":"Music","name":"Toner med sugrör","minutes":5,"xp":15,"icon":"music","prompt":"Prova lätt fonation med delvis slutet ansatsrör.","category":"music"},"music-theory-4":{"id":"music-theory-4","stat":"Music","name":"Treklanger från grunden","minutes":20,"xp":30,"icon":"music","prompt":"Förstå grundton, ters och kvint.","category":"music"},"music-ear-4":{"id":"music-ear-4","stat":"Music","name":"Hör dur och moll","minutes":20,"xp":30,"icon":"music","prompt":"Känn igen treklangens karaktär.","category":"music"},"music-voice-4":{"id":"music-voice-4","stat":"Music","name":"Fem toner med jämn klang","minutes":8,"xp":20,"icon":"music","prompt":"Samordna små skalrörelser utan att öka trycket.","category":"music"},"music-theory-5":{"id":"music-theory-5","stat":"Music","name":"Omvändningar","minutes":20,"xp":30,"icon":"music","prompt":"Samma treklang kan ha olika baston.","category":"music"},"music-ear-5":{"id":"music-ear-5","stat":"Music","name":"Skalornas färg","minutes":20,"xp":30,"icon":"music","prompt":"Skilj dur, naturlig moll och harmonisk moll.","category":"music"},"music-voice-5":{"id":"music-voice-5","stat":"Music","name":"Små registerglidningar","minutes":8,"xp":20,"icon":"music","prompt":"Utforska övergångar med liten ansträngning.","category":"music"},"music-theory-6":{"id":"music-theory-6","stat":"Music","name":"Fyrklanger","minutes":20,"xp":30,"icon":"music","prompt":"Lägg till septiman och hör ackordets färg.","category":"music"},"music-ear-6":{"id":"music-ear-6","stat":"Music","name":"Intervall åt båda håll","minutes":20,"xp":30,"icon":"music","prompt":"Känn igen intervall utan en fast riktning.","category":"music"},"music-voice-6":{"id":"music-voice-6","stat":"Music","name":"Mixed voice: hitta en lätt övergång","minutes":10,"xp":20,"icon":"music","prompt":"Mixed voice används på olika sätt inom sångpedagogik. Målet här är en bekväm registerövergång, inte ett test av en särskild mekanism.","category":"music"},"music-theory-7":{"id":"music-theory-7","stat":"Music","name":"Ackordens funktion","minutes":20,"xp":30,"icon":"music","prompt":"Se hur ackord hör ihop inom en tonart.","category":"music"},"music-ear-7":{"id":"music-ear-7","stat":"Music","name":"Hör fyrklanger","minutes":20,"xp":30,"icon":"music","prompt":"Skilj maj7, m7 och dominant7.","category":"music"},"music-voice-7":{"id":"music-voice-7","stat":"Music","name":"Ditt användbara omfång","minutes":10,"xp":20,"icon":"music","prompt":"Kartlägg bekväma toner, utan att jaga ytterlägen.","category":"music"},"music-theory-8":{"id":"music-theory-8","stat":"Music","name":"Pentatonik och modal färg","minutes":20,"xp":30,"icon":"music","prompt":"Välj toner med en musikalisk avsikt.","category":"music"},"music-ear-8":{"id":"music-ear-8","stat":"Music","name":"Melodi och rytm på gehör","minutes":20,"xp":30,"icon":"music","prompt":"Flytta gehör från enskilda intervall till fraser.","category":"music"},"music-voice-8":{"id":"music-voice-8","stat":"Music","name":"Smidiga fraser","minutes":10,"xp":20,"icon":"music","prompt":"Träna artikulation och små melodiska figurer.","category":"music"},"music-theory-9":{"id":"music-theory-9","stat":"Music","name":"Transponera en låt","minutes":20,"xp":30,"icon":"music","prompt":"Anpassa harmonik och melodi till din röst.","category":"music"},"music-ear-9":{"id":"music-ear-9","stat":"Music","name":"Hör harmonisk rörelse","minutes":20,"xp":30,"icon":"music","prompt":"Lyssna efter bas och funktion tillsammans.","category":"music"},"music-voice-9":{"id":"music-voice-9","stat":"Music","name":"Register i en riktig låt","minutes":15,"xp":25,"icon":"music","prompt":"Överför lätt koordination till musik.","category":"music"},"music-theory-10":{"id":"music-theory-10","stat":"Music","name":"Ditt musikprojekt","minutes":20,"xp":30,"icon":"music","prompt":"Knyt ihop ackord, skalor och form.","category":"music"},"music-ear-10":{"id":"music-ear-10","stat":"Music","name":"Transkribera och kontrollera","minutes":20,"xp":30,"icon":"music","prompt":"Använd hela ditt gehör på ett kort musikstycke.","category":"music"},"music-voice-10":{"id":"music-voice-10","stat":"Music","name":"En hållbar framföranderutin","minutes":15,"xp":25,"icon":"music","prompt":"Samla klang, tonträff och uttryck i en anpassad rutin.","category":"music"}}';programs jsonb='{"first-step":{"id":"first-step","name":"Börja där du är","tag":"NYBÖRJARE","minutes":8,"kind":"strength","description":"En mjuk start med tre enkla kroppsviktsrörelser.","moves":[["wall-push",2,8],["chair-squat",2,8],["dead-bug",2,6]],"rest":40},"full-body":{"id":"full-body","name":"Bodyweight foundations","tag":"CALISTHENICS","minutes":15,"kind":"strength","description":"Press, ben och bål. Ett litet, komplett pass.","moves":[["push-up",2,6],["squat",2,10],["plank",2,20]],"rest":60},"pull-foundation":{"id":"pull-foundation","name":"Pull & control","tag":"STÅNG / RÄCKE","minutes":15,"kind":"strength","description":"Kontrollerad dragstyrka. Säker, fast förankrad utrustning krävs.","moves":[["assisted-pull",2,5],["row",2,8],["dead-hang",2,15]],"rest":75},"core-control":{"id":"core-control","name":"Stark från mitten","tag":"BÅL","minutes":10,"kind":"strength","description":"Stabilitet med lugn andning och korta omgångar.","moves":[["dead-bug",2,6],["bird-dog",2,6],["side-plank",2,15]],"rest":45},"mobility":{"id":"mobility","name":"Mer rörelsefrihet","tag":"FLEXIBILITY","minutes":7,"kind":"mobility","description":"Lugn rörelse för rygg, höft och fotleder.","moves":[["cat-cow",1,6],["thoracic",1,6],["hip-hinge",1,8],["ankle-rock",1,8]],"rest":20},"strong-legs":{"id":"strong-legs","name":"Stadigare steg","tag":"BEN","minutes":12,"kind":"strength","description":"Bygg stabilitet i ett kontrollerat tempo.","moves":[["squat",2,10],["reverse-lunge",2,6],["glute-bridge",2,10],["calf-raise",2,12]],"rest":60},"reset-move":{"id":"reset-move","name":"Tillbaka med ett steg","tag":"COMEBACK","minutes":3,"kind":"recovery","description":"En kort, anpassningsbar start. Ingen ökande bestraffning.","moves":[["wall-push",1,5],["chair-squat",1,5],["walk-reset",1,60]],"rest":20},"reset-mobility":{"id":"reset-mobility","name":"Starta mjukt igen","tag":"COMEBACK","minutes":4,"kind":"recovery","description":"Välj rörlighet när kroppen behöver en lugnare väg tillbaka.","moves":[["shoulder-circle",1,6],["cat-cow",1,6],["breathing",1,60]],"rest":15},"reset-calm":{"id":"reset-calm","name":"En lugn omstart","tag":"COMEBACK","minutes":2,"kind":"recovery","description":"Sitt bekvämt och följ några lugna andetag.","moves":[["breathing",1,120]],"rest":0}}';exercise_ids jsonb='["wall-push","incline-push","knee-push","push-up","close-push","pike-push","chair-squat","squat","split-squat","reverse-lunge","calf-raise","glute-bridge","dead-bug","bird-dog","plank","side-plank","hollow-hold","dead-hang","assisted-pull","pull-up","row","thoracic","cat-cow","ankle-rock","hip-hinge","shoulder-circle","breathing","walk-reset"]';v_kind text;v_date text;v_count integer;v_now numeric=extract(epoch from now())*1000;v_index integer;
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
   if h ? 'durationMinutes' and (jsonb_typeof(h->'durationMinutes') is distinct from 'number' or (h->>'durationMinutes')::numeric not between 1 and 120 or (h->>'durationMinutes')::numeric<>floor((h->>'durationMinutes')::numeric)) then raise exception 'Välj 1–120 hela minuter.';end if;
   meta=public.arc_habit_meta(h);
   if length(coalesce(h->>'id','')) not between 1 and 100 or length(trim(coalesce(h->>'name',''))) not between 1 and 70 or h->>'category' not in ('strength','mobility','health','discipline','wisdom','faith','social','music') or (h->>'target')::numeric not between 1 and 100000 or jsonb_typeof(h->'days') is distinct from 'array' or jsonb_array_length(h->'days') not between 1 and 7 then raise exception 'Ogiltig vana.';end if;
   if h->>'templateId' is not null and meta is null then raise exception 'Okänd biblioteksaktivitet.';end if;
   if (h->>'xp')::numeric<>greatest(1,coalesce(round((meta->>'xp')::numeric*least(1,(h->>'target')::numeric/(meta->>'target')::numeric)),15)) or h->>'activityKey' is distinct from public.arc_habit_key(h) or (meta is not null and (h->>'category' is distinct from meta->>'category' or h->>'unit' is distinct from meta->>'unit')) then raise exception 'XP och stat bestäms av aktivitetens definition.';end if;
   select value into prior from jsonb_array_elements(coalesce(old->'habits','[]')) x(value) where value->>'id'=h->>'id';
   if prior is null and h->>'start'<greatest(day,p#>>'{expedition,start}') then raise exception 'Nya vanor kan inte bakdateras.';end if;
   if prior is not null then
     if public.arc_habit_meta(prior) is not null and public.arc_habit_key(prior)<>public.arc_habit_key(h) then raise exception 'En biblioteksaktivitet kan inte byta identitet.';end if;
     if prior->>'start' is distinct from h->>'start' and h->>'start'<>greatest(prior->>'start',p#>>'{expedition,start}') then raise exception 'Vanans start är låst.';end if;
     if day>=prior->>'start' and not coalesce((prior->>'archived')::boolean,false) and prior->'days' @> to_jsonb(array[extract(dow from day::date)::integer]) then
       if prior->>'pendingDate'<=day then prior=prior||(prior->'pending');end if;
       if prior->'target' is distinct from h->'target' or prior->'days' is distinct from h->'days' or prior->'durationMinutes' is distinct from h->'durationMinutes' then raise exception 'Dagens mål är låst. Ändringar gäller från nästa dag.';end if;
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
       if e.value->'durationMinutes' is distinct from h->'durationMinutes' then raise exception 'Tiden måste följa vanans låsta mål.';end if;
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


create or replace function public.arc_strength_meta(id text) returns jsonb language sql immutable set search_path=public,pg_temp as $$select value from jsonb_array_elements('[{"id":"bench","name":"Bänkpress","muscle":"Bröst","equipment":"Skivstång","family":"push","pose":"bench","thresholds":[0.35,0.6,0.85,1.1,1.4,1.7],"cue":"Fötter i golvet, skuldror stadiga. Sänk stången kontrollerat och pressa upp. Använd passare eller säkerhetsarmar.","unit":"kg"},{"id":"squat","name":"Knäböj","muscle":"Ben","equipment":"Skivstång","family":"legs","pose":"squat","thresholds":[0.5,0.8,1.1,1.5,1.9,2.3],"cue":"Spänn bålen och låt knäna följa tårna. Välj ett kontrollerat djup. Använd rackets säkerhetsarmar.","unit":"kg"},{"id":"deadlift","name":"Marklyft","muscle":"Rygg & ben","equipment":"Skivstång","family":"legs","pose":"hinge","thresholds":[0.6,1,1.4,1.8,2.2,2.6],"cue":"Håll stången nära kroppen. Skapa spänning före lyftet och res dig med höft och knän tillsammans.","unit":"kg"},{"id":"press","name":"Axelpress","muscle":"Axlar","equipment":"Skivstång","family":"push","pose":"press","thresholds":[0.2,0.35,0.5,0.65,0.8,1],"cue":"Stå stadigt, håll revbenen nere och pressa utan att översträcka ryggen.","unit":"kg"},{"id":"row","name":"Skivstångsrodd","muscle":"Rygg","equipment":"Skivstång","family":"pull","pose":"row","thresholds":[0.3,0.5,0.7,0.9,1.1,1.3],"cue":"Fäll i höften och håll bålen stabil. Dra mot nedre revbenen utan att kasta upp vikten.","unit":"kg"},{"id":"db-bench","name":"Hantelpress","muscle":"Bröst","equipment":"Hantlar","family":"push","pose":"bench","thresholds":[0.15,0.25,0.35,0.45,0.55,0.65],"cue":"Sänk hantlarna lugnt med stabila skuldror. Logga vikten för EN hantel.","unit":"kg"},{"id":"db-row","name":"Hantelrodd","muscle":"Rygg","equipment":"Hantlar","family":"pull","pose":"row","thresholds":[0.15,0.25,0.35,0.45,0.55,0.7],"cue":"Stöd ena handen på en stabil bänk. Dra utan att vrida bålen. Logga EN hantel.","unit":"kg"},{"id":"curl","name":"Skivstångscurl","muscle":"Armar","equipment":"Skivstång","family":"pull","pose":"curl","thresholds":[0.15,0.25,0.35,0.45,0.55,0.65],"cue":"Håll överarmarna nära kroppen. Böj armbågen utan att svinga bålen.","unit":"kg"},{"id":"lateral","name":"Sidolyft","muscle":"Axlar","equipment":"Hantlar","family":"push","pose":"lateral","thresholds":[0.03,0.06,0.09,0.12,0.15,0.18],"cue":"Mjuka armbågar, lätta vikter och kontrollerad rörelse till bekväm höjd. Logga EN hantel.","unit":"kg"},{"id":"pulldown","name":"Latsdrag","muscle":"Rygg","equipment":"Kabel","family":"pull","pose":"pull","thresholds":[0.3,0.5,0.7,0.9,1.1,1.3],"cue":"Sitt stadigt och dra framför huvudet mot övre bröstet. Jämför på samma maskin.","unit":"kg"},{"id":"cable-row","name":"Sittande kabelrodd","muscle":"Rygg","equipment":"Kabel","family":"pull","pose":"seated-row","thresholds":[0.3,0.5,0.7,0.9,1.1,1.3],"cue":"Håll bålen stilla och dra handtaget mot magen. Jämför på samma maskin.","unit":"kg"},{"id":"pushdown","name":"Tricepspress","muscle":"Armar","equipment":"Kabel","family":"push","pose":"curl","thresholds":[0.1,0.2,0.3,0.4,0.5,0.6],"cue":"Håll armbågarna nära sidan. Sträck utan att pressa axlarna framåt. Samma maskin varje gång.","unit":"kg"},{"id":"leg-press","name":"Benpress","muscle":"Ben","equipment":"Maskin","family":"legs","pose":"leg-press","thresholds":[0.5,1,1.5,2,2.5,3],"cue":"Håll bäckenet mot dynan och använd kontrollerat rörelseomfång. Maskinens kg är inte jämförbara med andra modeller.","unit":"kg"},{"id":"leg-curl","name":"Lårcurl","muscle":"Ben","equipment":"Maskin","family":"legs","pose":"leg-curl","thresholds":[0.15,0.3,0.45,0.6,0.75,0.9],"cue":"Ställ in maskinen efter knäleden. Böj lugnt och håll höften mot dynan.","unit":"kg"},{"id":"pullup","name":"Pull-up","muscle":"Rygg","equipment":"Räcke","family":"pull","pose":"pull","thresholds":[1,3,6,10,15,20],"cue":"Börja med kontrollerade skuldror. Dra utan kippning och sänk lugnt. Denna variant är utan assistans.","unit":"reps"},{"id":"dip","name":"Dips","muscle":"Bröst & armar","equipment":"Räcke","family":"push","pose":"dip","thresholds":[1,4,8,12,18,25],"cue":"Håll skuldrorna stabila. Sänk bara så långt du kan kontrollera bekvämt. Ingen assistans i denna variant.","unit":"reps"},{"id":"pushup","name":"Armhävning","muscle":"Bröst","equipment":"Kroppsvikt","family":"push","pose":"pushup","thresholds":[3,8,15,25,40,60],"cue":"Håll kroppen som en linje och sänk kontrollerat. Logga strikta repetitioner från tårna.","unit":"reps"},{"id":"plank","name":"Planka","muscle":"Bål","equipment":"Kroppsvikt","family":"core","pose":"plank","thresholds":[15,30,45,60,90,120],"cue":"Spänn bålen och andas lugnt. Avsluta när du inte kan hålla en stabil position.","unit":"sek"},{"id":"hang","name":"Dead hang","muscle":"Grepp","equipment":"Räcke","family":"core","pose":"hang","thresholds":[10,20,35,50,75,100],"cue":"Använd ett säkert räcke. Häng kontrollerat och avlasta direkt vid obehag.","unit":"sek"},{"id":"handstand","name":"Handstående mot vägg","muscle":"Balans & axlar","equipment":"Kroppsvikt","family":"core","pose":"handstand","thresholds":[5,10,20,30,45,60],"cue":"Öva med säker vägg och fri golvyta. Börja med enklare lutning och lär dig ta dig ner kontrollerat. Väggstöd är en egen färdighet, inte fritt handstående.","unit":"sek"}]'::jsonb) where value->>'id'=$1 limit 1$$;
create or replace function public.arc_day_xp(p_day jsonb) returns numeric
language sql immutable set search_path=public,pg_temp as $$
 with entries as (select key,value from jsonb_each(coalesce(p_day->'entries','{}')) where (value->>'value')::numeric >= (value->>'target')::numeric), habits as (select value,case when value ? 'durationMinutes' then 2*(value->>'durationMinutes')::numeric else (value->>'xp')::numeric end points from entries where coalesce(value->>'source','habit')<>'challenge'), amounts as (select coalesce(sum(points),0) total,coalesce(sum(points) filter(where value->>'category'='music'),0) music,coalesce(sum(points) filter(where value->>'activityKey'='meditation'),0) meditation from habits)
 select case when exists(select 1 from jsonb_each(coalesce(p_day->'entries','{}')) where value ? 'durationMinutes') then least(240,a.total)+least(100,greatest(0,coalesce((select sum((value->>'xp')::numeric) from entries where value->>'source'='challenge' and value->>'category'='music'),0)-a.music)+coalesce((select sum(greatest(0,(value->>'xp')::numeric-case when key='challenge:meditation-notice' then a.meditation else 0 end)) from entries where value->>'source'='challenge' and value->>'category'<>'music'),0)) else public.arc_day_xp_v6(p_day) end from amounts a;
$$;
create or replace function public.arc_strength_score(w jsonb,exercise text) returns numeric
language sql immutable set search_path=public,pg_temp as $$
 select coalesce(max(case when public.arc_strength_meta(exercise)->>'unit'='kg' then case when (s->>'reps')::numeric between 1 and 10 then (s->>'kg')::numeric*36/(37-(s->>'reps')::numeric) else 0 end else (s->>'reps')::numeric end),0)
 from jsonb_array_elements(coalesce(w->'exercises','[]')) e cross join lateral jsonb_array_elements(e->'sets') s where e->>'id'=exercise and s->>'done'='true';
$$;
create or replace function public.arc_strength_minutes(w jsonb) returns numeric
language sql immutable set search_path=public,pg_temp as $$
 select greatest(0,least(120,floor(((w->>'finishedAt')::numeric-(w->>'startedAt')::numeric-coalesce((w->>'pausedMs')::numeric,0))/60000),5*(select count(*) from jsonb_array_elements(w->'exercises') e cross join lateral jsonb_array_elements(e->'sets') s where s->>'done'='true')));
$$;
create or replace function public.arc_strength_xp(p jsonb,until_day text) returns bigint
language plpgsql immutable set search_path=public,pg_temp as $$
declare d text;mins numeric;habit numeric;bonus numeric;w jsonb;e jsonb;prev numeric;cur numeric;pr_ids text[];total numeric=0;
begin
 for d in select distinct x->>'date' from jsonb_array_elements(coalesce(p#>'{strength,sessions}','[]')) x where x->>'date'>=p#>>'{expedition,start}' and x->>'date'<=until_day loop
  mins=0;pr_ids=array[]::text[];
  for w in select value from jsonb_array_elements(p#>'{strength,sessions}') where value->>'date'=d loop
   mins=mins+public.arc_strength_minutes(w);
   for e in select value from jsonb_array_elements(w->'exercises') loop
    select coalesce(max(public.arc_strength_score(x,e->>'id')),0) into prev from jsonb_array_elements(p#>'{strength,sessions}') x where x->>'date'<d and x->>'date'>=p#>>'{expedition,start}';
    cur=public.arc_strength_score(w,e->>'id');
    if prev>0 and cur>=prev+(case when public.arc_strength_meta(e->>'id')->>'unit'='kg' then greatest(1,prev*.01) else 1 end) and not (e->>'id'=any(pr_ids)) then pr_ids=array_append(pr_ids,e->>'id');end if;
   end loop;
  end loop;
  select coalesce(sum(case when value ? 'durationMinutes' then 2*(value->>'durationMinutes')::numeric else (value->>'xp')::numeric end),0) into habit from jsonb_each(coalesce(p->'history'->d->'entries','{}')) where value->>'category'='strength' and (value->>'value')::numeric >= (value->>'target')::numeric;
  total=total+greatest(0,least(240,2*mins)-habit-(public.arc_training_xp(p,d)-public.arc_training_xp(p,(d::date-1)::text)))+least(20,5*cardinality(pr_ids));
 end loop;
 return total::bigint;
end;$$;
create or replace function public.arc_prepare_strength(p jsonb,old jsonb,day text) returns jsonb
language plpgsql volatile set search_path=public,pg_temp as $$
declare a jsonb=p#>'{strength,active}';b jsonb=old#>'{strength,active}';new_sessions jsonb='[]';w jsonb;ts numeric=floor(extract(epoch from clock_timestamp())*1000);
begin
 if a is not null and a<>'null'::jsonb then
  if a->>'id' is distinct from b->>'id' then
   a=a||jsonb_build_object('startedAt',ts,'pausedAt',null,'pausedMs',0,'finishedAt',null,'bodyweight',p#>'{profile,weight}','height',p#>'{profile,height}');
  else
   a=a||jsonb_build_object('startedAt',b->'startedAt','bodyweight',b->'bodyweight','height',b->'height','pausedMs',coalesce(b->'pausedMs','0'::jsonb),'finishedAt',null);
   if b->>'pausedAt' is null and a->>'pausedAt' is not null then a=jsonb_set(a,'{pausedAt}',to_jsonb(ts));
   elsif b->>'pausedAt' is not null and a->>'pausedAt' is null then a=jsonb_set(a,'{pausedMs}',to_jsonb(coalesce((b->>'pausedMs')::numeric,0)+greatest(0,ts-(b->>'pausedAt')::numeric)));
   else a=jsonb_set(a,'{pausedAt}',coalesce(b->'pausedAt','null'::jsonb));end if;
  end if;
  p=jsonb_set(p,'{strength,active}',a);
 end if;
 if p ? 'strength' then
  for w in select value from jsonb_array_elements(coalesce(p#>'{strength,sessions}','[]')) loop
   if not exists(select 1 from jsonb_array_elements(coalesce(old#>'{strength,sessions}','[]')) saved where saved->>'id'=w->>'id') and w->>'id'=b->>'id' then
    w=w||jsonb_build_object('finishedAt',ts,'pausedAt',null,'pausedMs',coalesce((b->>'pausedMs')::numeric,0)+case when b->>'pausedAt' is not null then greatest(0,ts-(b->>'pausedAt')::numeric) else 0 end);
   end if;
   new_sessions=new_sessions||jsonb_build_array(w);
  end loop;
  p=jsonb_set(p,'{strength,sessions}',new_sessions);
 end if;
 return p;
end;$$;
create or replace function public.arc_validate_strength(p jsonb,old jsonb,day text) returns void
language plpgsql stable set search_path=public,pg_temp as $$
declare w jsonb;previous jsonb;a jsonb=p#>'{strength,active}';b jsonb=old#>'{strength,active}';e jsonb;v jsonb;m jsonb;ts numeric=floor(extract(epoch from clock_timestamp())*1000);
begin
 if p#>>'{profile,photo}' is not null and p#>>'{profile,photo}' not like auth.uid()::text||'/avatar/%' then raise exception 'Ogiltig profilbild.';end if;
 if p#>>'{profile,weight}' is not null and (p#>>'{profile,weight}')::numeric not between 25 and 400 then raise exception 'Kontrollera kroppsvikten.';end if;
 if p#>>'{profile,height}' is not null and (p#>>'{profile,height}')::numeric not between 100 and 250 then raise exception 'Kontrollera längden.';end if;
 if p->'strength' is null then if old->'strength' is not null then raise exception 'Styrkejournalen måste behållas.';end if;return;end if;
 if jsonb_typeof(p#>'{strength,sessions}') is distinct from 'array' or jsonb_array_length(p#>'{strength,sessions}')>1000 then raise exception 'Ogiltig styrkejournal.';end if;
 if exists(select 1 from jsonb_array_elements(p#>'{strength,sessions}') x group by x->>'id' having count(*)>1) then raise exception 'Duplicerat pass.';end if;
 if exists(select 1 from jsonb_array_elements(p#>'{strength,sessions}') x cross join lateral jsonb_array_elements(x->'exercises') ex group by x->>'date',ex->>'id' having count(*)>1) then raise exception 'Övningen är redan sparad idag.';end if;
 for w in select value from jsonb_array_elements(coalesce(old#>'{strength,sessions}','[]')) loop
  select value into previous from jsonb_array_elements(p#>'{strength,sessions}') where value->>'id'=w->>'id';
  if previous is distinct from w then raise exception 'Sparade styrkepass är låsta.';end if;
 end loop;
 for w in select n.value from jsonb_array_elements(p#>'{strength,sessions}') n(value) where not exists(select 1 from jsonb_array_elements(coalesce(old#>'{strength,sessions}','[]')) x where x->>'id'=n.value->>'id') loop
  if jsonb_typeof(w->'finishedAt') is distinct from 'number' or jsonb_typeof(w->'pausedMs') is distinct from 'number' or w->>'pausedAt' is not null then raise exception 'Ogiltig sluttid.';end if;
  if w->>'date' is distinct from day or b->>'id' is distinct from w->>'id' or w->'startedAt' is distinct from b->'startedAt' or w->'exercises' is distinct from b->'exercises' or w->'bodyweight' is distinct from b->'bodyweight' or w->'height' is distinct from b->'height' then raise exception 'Starta och logga passet innan du sparar.';end if;
  if abs((w->>'finishedAt')::numeric-ts)>120000 or (w->>'finishedAt')::numeric<(w->>'startedAt')::numeric or (w->>'pausedMs')::numeric<coalesce((b->>'pausedMs')::numeric,0) or (w->>'pausedMs')::numeric>(w->>'finishedAt')::numeric-(w->>'startedAt')::numeric then raise exception 'Passets tid stämmer inte.';end if;
  if b->>'pausedAt' is not null and (w->>'pausedMs')::numeric<coalesce((b->>'pausedMs')::numeric,0)+(w->>'finishedAt')::numeric-(b->>'pausedAt')::numeric-2000 then raise exception 'Pausad tid får inte ge XP.';end if;
  if not exists(select 1 from jsonb_array_elements(w->'exercises') ex cross join lateral jsonb_array_elements(ex->'sets') st where st->>'done'='true') then raise exception 'Registrera minst ett set.';end if;
 end loop;
 if a is not null and a<>'null'::jsonb then
  if p#>>'{training,active,id}' is not null then raise exception 'Bara ett träningspass kan pågå.';end if;
  if a->>'date' is distinct from day and a->>'id' is distinct from b->>'id' then raise exception 'Passet måste börja idag.';end if;
  if length(coalesce(a->>'id','')) not between 1 and 100 or length(coalesce(a->>'note',''))>500 or jsonb_typeof(a->'exercises') is distinct from 'array' or jsonb_array_length(a->'exercises')>8 then raise exception 'Kontrollera passets övningar.';end if;
  if exists(select 1 from jsonb_array_elements(a->'exercises') x group by x->>'id' having count(*)>1) then raise exception 'Lägg till set, inte dubbla övningar.';end if;
  for e in select value from jsonb_array_elements(a->'exercises') loop
   m=public.arc_strength_meta(e->>'id');
   if m is null or jsonb_typeof(e->'sets') is distinct from 'array' or jsonb_array_length(e->'sets') not between 1 and 6 then raise exception 'Välj en katalogövning och 1–6 set.';end if;
   for v in select value from jsonb_array_elements(e->'sets') loop
    if jsonb_typeof(v->'done') is distinct from 'boolean' or jsonb_typeof(v->'kg') is distinct from 'number' or jsonb_typeof(v->'reps') is distinct from 'number' or (v->>'kg')::numeric not between 0 and 600 or (v->>'reps')::numeric not between 0 and (case when m->>'unit'='sek' then 600 else 100 end) or (v->>'reps')::numeric<>floor((v->>'reps')::numeric) then raise exception 'Ogiltig vikt, antal eller tid.';end if;
    if v->>'done'='true' and ((v->>'reps')::numeric<1 or (m->>'unit'='kg' and (v->>'kg')::numeric<=0)) then raise exception 'Fyll i setets resultat.';end if;
   end loop;
  end loop;
 end if;
end;$$;
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
 p_payload=public.arc_prepare_strength(p_payload,v_old,v_today);
 perform public.arc_validate_strength(p_payload,v_old,v_today);
 perform public.arc_validate_calendar(p_payload,v_old,v_today);
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


create or replace function public.arc_total_xp(p_payload jsonb,p_until text) returns bigint
language plpgsql immutable set search_path=public,pg_temp as $$
declare rec record;total numeric=0;v_start text=coalesce(p_payload#>>'{expedition,start}','2026-11-09');
begin
 for rec in select key,value from jsonb_each(coalesce(p_payload->'history','{}')) loop
   if rec.key>=v_start and rec.key<=p_until then total=total+public.arc_day_xp(rec.value);end if;
 end loop;
 for rec in select key,value from jsonb_each(coalesce(p_payload->'claims','{}')) loop
   if rec.value->>'date'>=v_start and rec.value->>'date'<=p_until then total=total+case when rec.key like 'three:%' then 50 when rec.key like 'perfect:%' then 100 when rec.key like 'reflect:%' then 75 when rec.key like 'comeback:%' then 40 else 0 end;end if;
 end loop;
 return total::bigint+public.arc_training_xp(p_payload,p_until)+public.arc_strength_xp(p_payload,p_until);
end;
$$;
revoke all on function public.arc_day_xp_v6(jsonb),public.arc_strength_meta(text),public.arc_strength_score(jsonb,text),public.arc_strength_minutes(jsonb),public.arc_strength_xp(jsonb,text),public.arc_prepare_strength(jsonb,jsonb,text),public.arc_validate_strength(jsonb,jsonb,text) from public,anon,authenticated;
commit;
