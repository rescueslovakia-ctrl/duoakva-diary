-- DuoAkva Diary: starter verified livestock catalog
-- Compatible with legacy livestock_catalog tables without UNIQUE(scientific_name, variant).

with seed(scientific_name,common_name,category,variant,adult_size_cm,min_tank_l,min_group_size,recommended_group_size,temperature_min,temperature_max,ph_min,ph_max,gh_min,gh_max,kh_min,kh_max,temperament,swimming_zone,diet,difficulty,shrimp_safe,snail_safe,plant_safe,notes,source_name,source_url,verification_status) as (
 values
 ('Paracheirodon innesi','Neónka obyčajná','fish','',3,54,10,15,21,25,5.0,7.5,1,12,null,null,'mierumilovná, húfová','stredná vrstva','všežravec','easy',false,true,true,'Stabilná zabehnutá nádrž; väčšia skupina znižuje stres.','Overený online profil','https://www.aquarium-anfaenger.de/fisch/neonsalmler','verified'),
 ('Paracheirodon axelrodi','Neónka červená','fish','',5,60,10,20,23,27,5.0,6.5,3,12,1,4,'veľmi mierumilovná, húfová','stredná vrstva','všežravec','medium',false,true,true,'Citlivejšia na nestabilnú vodu; vhodná do dobre zabehnutej nádrže.','Overený online profil','https://www.aquarium-dietzenbach.de/descriptions_paracheirodon_axelrodi','verified'),
 ('Corydoras pygmaeus','Pancierniček trpasličí','fish','',3,45,8,10,22,26,6.0,7.5,2,15,null,null,'mierumilovná, spoločenská','dno a stredná vrstva','všežravec','easy',null,true,true,'Vyžaduje skupinu; jemný substrát je vhodnejší pre fúziky.','Overený online profil','https://aquariumcompass.com/inhabitants/pygmy-corydoras','verified'),
 ('Neocaridina davidi','Neocaridina / Cherry shrimp','shrimp','',3,20,10,20,18,28,6.5,8.0,6,15,2,8,'mierumilovná, koloniálna','dno, rastliny a dekorácie','všežravec / biofilm','easy',true,true,true,'Dôležitejšia je stabilita vody a zabehnutý biofilm než naháňanie presnej hodnoty.','Overený online profil','https://www.zoetwateraquarium.nl/kennisbank/garnaal/red-cherry-garnaal/','verified'),
 ('Caridina multidentata','Krevetka Amano','shrimp','',6,30,4,6,20,27,6.0,7.8,4,15,null,null,'mierumilovná, spoločenská','dno, rastliny a dekorácie','všežravec / riasy / biofilm','easy',true,true,true,'Larvy sa bežne neodchovajú v čistej sladkej vode.','Overený online profil','https://aquariumcompass.com/inhabitants/amano-shrimp','verified')
), updated as (
 update public.livestock_catalog l
 set common_name=s.common_name,
     category=s.category,
     variant=s.variant,
     adult_size_cm=s.adult_size_cm,
     min_tank_l=s.min_tank_l,
     min_group_size=s.min_group_size,
     recommended_group_size=s.recommended_group_size,
     temperature_min=s.temperature_min,
     temperature_max=s.temperature_max,
     ph_min=s.ph_min,
     ph_max=s.ph_max,
     gh_min=s.gh_min,
     gh_max=s.gh_max,
     kh_min=s.kh_min,
     kh_max=s.kh_max,
     temperament=s.temperament,
     swimming_zone=s.swimming_zone,
     diet=s.diet,
     difficulty=s.difficulty,
     shrimp_safe=s.shrimp_safe,
     snail_safe=s.snail_safe,
     plant_safe=s.plant_safe,
     notes=s.notes,
     source_name=s.source_name,
     source_url=s.source_url,
     verification_status=s.verification_status,
     updated_at=now()
 from seed s
 where l.scientific_name=s.scientific_name
   and coalesce(l.variant,'')=coalesce(s.variant,'')
 returning l.scientific_name, coalesce(l.variant,'') as variant
)
insert into public.livestock_catalog
(scientific_name,common_name,category,variant,adult_size_cm,min_tank_l,min_group_size,recommended_group_size,temperature_min,temperature_max,ph_min,ph_max,gh_min,gh_max,kh_min,kh_max,temperament,swimming_zone,diet,difficulty,shrimp_safe,snail_safe,plant_safe,notes,source_name,source_url,verification_status,created_at,updated_at)
select s.scientific_name,s.common_name,s.category,s.variant,s.adult_size_cm,s.min_tank_l,s.min_group_size,s.recommended_group_size,s.temperature_min,s.temperature_max,s.ph_min,s.ph_max,s.gh_min,s.gh_max,s.kh_min,s.kh_max,s.temperament,s.swimming_zone,s.diet,s.difficulty,s.shrimp_safe,s.snail_safe,s.plant_safe,s.notes,s.source_name,s.source_url,s.verification_status,now(),now()
from seed s
where not exists (
 select 1 from public.livestock_catalog l
 where l.scientific_name=s.scientific_name
   and coalesce(l.variant,'')=coalesce(s.variant,'')
);