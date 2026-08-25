#!/usr/bin/env python3
import csv
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
TARGET = 100

def norm(s):
    s = (s or '').strip().lower()
    s = s.replace('’', "'").replace('‘', "'").replace('“','"').replace('”','"')
    s = re.sub(r'\s+', ' ', s)
    return s

def read_csv(name):
    with (DATA/name).open(encoding='utf-8', newline='') as f:
        return list(csv.DictReader(f))

def read_lines(name):
    return [x.strip() for x in (DATA/name).read_text(encoding='utf-8').splitlines() if x.strip()]

def check_unique(label, keys):
    seen=set(); dup=[]
    for k in keys:
        if k in seen: dup.append(k)
        seen.add(k)
    if dup:
        raise SystemExit(f'{label}: duplicate normalized keys: {dup[:10]}')
    return seen

plants=read_csv('plants.csv')
plant_candidates=read_lines('plant_candidates.txt')
plant_base={(norm(r['scientific_name']), norm(r.get('variant'))) for r in plants}
plant_cand=[]
for line in plant_candidates:
    scientific,variant,source=(line.split('|')+['',''])[:3]
    plant_cand.append((norm(scientific),norm(variant)))
check_unique('plant candidates',plant_cand)
plant_union=plant_base|set(plant_cand)

livestock=read_csv('livestock.csv')
livestock_candidates=read_lines('livestock_candidates.txt')
liv_base={(norm(r['scientific_name']),norm(r.get('variant'))) for r in livestock}
liv_cand=[]
for line in livestock_candidates:
    scientific,common,category=(line.split('|')+['',''])[:3]
    liv_cand.append((norm(scientific),''))
check_unique('livestock candidates',liv_cand)
liv_union=liv_base|set(liv_cand)

equipment=read_csv('equipment.csv')
equipment_candidates=read_lines('equipment_candidates.txt')
eq_base={(norm(r['category']),norm(r['manufacturer']),norm(r['model']),norm(r.get('variant'))) for r in equipment}
eq_cand=[]
for line in equipment_candidates:
    category,manufacturer,model,variant=(line.split('|')+['','',''])[:4]
    eq_cand.append((norm(category),norm(manufacturer),norm(model),norm(variant)))
check_unique('equipment candidates',eq_cand)
eq_union=eq_base|set(eq_cand)

fert=read_csv('fertilizers.csv')
fert_candidates=read_lines('fertilizer_candidates.txt')
fert_base={(norm(r['manufacturer']),norm(r['product_name']),norm(r.get('product_variant'))) for r in fert}
fert_cand=[]
for line in fert_candidates:
    manufacturer,product,category=(line.split('|')+['',''])[:3]
    fert_cand.append((norm(manufacturer),norm(product),''))
check_unique('fertilizer candidates',fert_cand)
fert_union=fert_base|set(fert_cand)

counts={
 'plants':len(plant_union),
 'livestock':len(liv_union),
 'fertilizers':len(fert_union),
 'equipment':len(eq_union),
}
for name,count in counts.items():
    print(f'{name}: {count} unique staged entries')
    if count < TARGET:
        raise SystemExit(f'{name}: below target {TARGET}')

safe=sum(1 for r in fert if norm(r.get('calculation_safe')) in {'true','1','yes'})
verified_fert=sum(1 for r in fert if norm(r.get('verification_status')) in {'verified','verified_label_override'})
verified_eq=sum(1 for r in equipment if norm(r.get('verification_status'))=='verified')
verified_plants=sum(1 for r in plants if norm(r.get('verification_status'))=='verified')
verified_liv=sum(1 for r in livestock if norm(r.get('verification_status'))=='verified')
print('Existing fully verified rows:')
print(f' plants={verified_plants}, livestock={verified_liv}, fertilizers={verified_fert}, equipment={verified_eq}')
print(f' fertilizers calculation_safe={safe}')
print('PASS: all four staged catalogs meet the minimum unique-entry target; candidates remain non-calculation-safe until enriched/verified.')
