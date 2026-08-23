-- DuoAkva Diary: starter verified livestock catalog
-- Run once in Supabase SQL Editor.

insert into public.livestock_catalog
(scientific_name,common_name,category,variant,adult_size_cm,min_tank_l,min_group_size,recommended_group_size,temperature_min,temperature_max,ph_min,ph_max,gh_min,gh_max,kh_min,kh_max,temperament,swimming_zone,diet,difficulty,shrimp_safe,snail_safe,plant_safe,notes,source_name,source_url,verification_status)
values
('Paracheirodon innesi','Neónka obyčajná','fish','',3,54,10,15,21,25,5.0,7.5,1,12,null,null,'mierumilovná, húfová','stredná vrstva','všežravec','easy',false,true,true,'Stabilná zabehnutá nádrž; väčšia skupina znižuje stres.','Overený online profil','https://www.aquarium-anfaenger.de/fisch/neonsalmler','verified'),
('Paracheirodon axelrodi','Neónka červená','fish','',5,60,10,20,23,27,5.0,6.5,3,12,1,4,'veľmi mierumilovná, húfová','stredná vrstva','všežravec','medium',false,true,true,'Citlivejšia na nestabilnú vodu; vhodná do dobre zabehnutej nádrže.','Overený online profil','https://www.aquarium-dietzenbach.de/descriptions_paracheirodon_axelrodi','verified'),
('Corydoras pygmaeus','Pancierniček trpasličí','fish','',3,45,8,10,22,26,6.0,7.5,2,15,null,null,'mierumilovná, spoločenská','dno a stredná vrstva','všežravec','easy',null,true,true,'Vyžaduje skupinu; jemný substrát je vhodnejší pre fúziky.','Overený online profil','https://aquariumcompass.com/inhabitants/pygmy-corydoras','verified'),
('Neocaridina davidi','Neocaridina / Cherry shrimp','shrimp','',3,20,10,20,18,28,6.5,8.0,6,15,2,8,'mierumilovná, koloniálna','dno, rastliny a dekorácie','všežravec / biofilm','easy',true,true,true,'Dôležitejšia je stabilita vody a zabehnutý biofilm než naháňanie presnej hodnoty.','Overený online profil','https://www.zoetwateraquarium.nl/kennisbank/garnaal/red-cherry-garnaal/','verified'),
('Caridina multidentata','Krevetka Amano','shrimp','',6,30,4,6,20,27,6.0,7.8,4,15,null,null,'mierumilovná, spoločenská','dno, rastliny a dekorácie','všežravec / riasy / biofilm','easy',true,true,true,'Larvy sa bežne neodchovajú v čistej sladkej vode.','Overený online profil','https://aquariumcompass.com/inhabitants/amano-shrimp','verified')
on conflict (scientific_name,variant) do update set
 common_name=excluded.common_name,
 category=excluded.category,
 adult_size_cm=excluded.adult_size_cm,
 min_tank_l=excluded.min_tank_l,
 min_group_size=excluded.min_group_size,
 recommended_group_size=excluded.recommended_group_size,
 temperature_min=excluded.temperature_min,
 temperature_max=excluded.temperature_max,
 ph_min=excluded.ph_min,
 ph_max=excluded.ph_max,
 gh_min=excluded.gh_min,
 gh_max=excluded.gh_max,
 kh_min=excluded.kh_min,
 kh_max=excluded.kh_max,
 temperament=excluded.temperament,
 swimming_zone=excluded.swimming_zone,
 diet=excluded.diet,
 difficulty=excluded.difficulty,
 shrimp_safe=excluded.shrimp_safe,
 snail_safe=excluded.snail_safe,
 plant_safe=excluded.plant_safe,
 notes=excluded.notes,
 source_name=excluded.source_name,
 source_url=excluded.source_url,
 verification_status=excluded.verification_status,
 updated_at=now();