#!/usr/bin/env python3
"""Generate reviewed, deterministic SQL from staged CSV files.

This script intentionally writes to catalog-prep/generated only. It never connects to Supabase.
"""
import csv
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'data'
OUT=ROOT/'generated'/'catalog_import.sql'


def q(v):
    if v is None or v=='': return 'null'
    return "'"+str(v).replace("'","''")+"'"

def n(v):
    if v is None or str(v).strip()=='': return 'null'
    return str(float(v)).rstrip('0').rstrip('.') if '.' in str(float(v)) else str(int(float(v)))

def b(v):
    return 'true' if str(v).strip().lower() in ('1','true','yes') else 'false'

def read(name):
    with (DATA/name).open(encoding='utf-8',newline='') as f:return list(csv.DictReader(f))

sql=['-- GENERATED FILE. Review before applying.','begin;','']

for r in read('plants.csv'):
    sql.append(f"""insert into public.plant_catalog(scientific_name,common_name,difficulty,light_requirement,co2_requirement,growth_rate,placement,ph_min,ph_max,gh_min,gh_max,kh_min,kh_max,temperature_min,temperature_max,notes,source_name,source_url,verification_status,verified_at)
values({q(r['scientific_name'])},{q(r['common_name'])},{q(r['difficulty'])},{q(r['light_requirement'])},{q(r['co2_requirement'])},{q(r['growth_rate'])},{q(r['placement'])},{n(r['ph_min'])},{n(r['ph_max'])},{n(r['gh_min'])},{n(r['gh_max'])},{n(r['kh_min'])},{n(r['kh_max'])},{n(r['temperature_min'])},{n(r['temperature_max'])},{q(r['notes'])},{q(r['source_name'])},{q(r['source_url'])},{q(r['verification_status'])},{q(r['verified_at'])}::timestamptz)
on conflict do nothing;""")

for r in read('livestock.csv'):
    sql.append(f"""insert into public.livestock_catalog(scientific_name,common_name,category,variant,adult_size_cm,min_tank_l,min_group_size,recommended_group_size,temperature_min,temperature_max,ph_min,ph_max,gh_min,gh_max,kh_min,kh_max,temperament,swimming_zone,diet,difficulty,shrimp_safe,snail_safe,plant_safe,notes,source_name,source_url,verification_status,verified_at)
values({q(r['scientific_name'])},{q(r['common_name'])},{q(r['category'])},{q(r['variant'])},{n(r['adult_size_cm'])},{n(r['min_tank_l'])},{n(r['min_group_size'])},{n(r['recommended_group_size'])},{n(r['temperature_min'])},{n(r['temperature_max'])},{n(r['ph_min'])},{n(r['ph_max'])},{n(r['gh_min'])},{n(r['gh_max'])},{n(r['kh_min'])},{n(r['kh_max'])},{q(r['temperament'])},{q(r['swimming_zone'])},{q(r['diet'])},{q(r['difficulty'])},{('null' if r['shrimp_safe']=='' else b(r['shrimp_safe']))},{('null' if r['snail_safe']=='' else b(r['snail_safe']))},{('null' if r['plant_safe']=='' else b(r['plant_safe']))},{q(r['notes'])},{q(r['source_name'])},{q(r['source_url'])},{q(r['verification_status'])},{q(r['verified_at'])}::timestamptz)
on conflict do nothing;""")

for r in read('fertilizers.csv'):
    sql.append(f"""insert into public.fertilizer_catalog(manufacturer,product_name,verification_status,verified_at,source_name,source_url,calculation_safe)
values({q(r['manufacturer'])},{q(r['product_name'])},{q(r['verification_status'])},{q(r['verified_at'])}::timestamptz,{q(r['source_name'])},{q(r['source_url'])},{b(r['calculation_safe'])})
on conflict do nothing;""")

for r in read('equipment.csv'):
    sql.append(f"""insert into public.equipment_catalog(category,manufacturer,model,power_w,flow_l_h,verification_status,verified_at,source_name,source_url)
values({q(r['category'])},{q(r['manufacturer'])},{q(r['model'])},{n(r['power_w'])},{n(r['flow_l_h'])},{q(r['verification_status'])},{q(r['verified_at'])}::timestamptz,{q(r['source_name'])},{q(r['source_url'])})
on conflict do nothing;""")

sql.extend(['','commit;',''])
OUT.parent.mkdir(parents=True,exist_ok=True)
OUT.write_text('\n\n'.join(sql),encoding='utf-8')
print(OUT)
