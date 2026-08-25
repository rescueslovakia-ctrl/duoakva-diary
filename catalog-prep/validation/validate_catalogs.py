#!/usr/bin/env python3
import csv,re,unicodedata
from pathlib import Path
from collections import Counter,defaultdict

ROOT=Path(__file__).resolve().parents[1]
DATA=ROOT/'data'

errors=[]
warnings=[]
ALLOWED_STATUS={'verified','verified_label_override','partial','review_required','unverified','secondary_consensus','conflicting_observation'}

def rows(name):
    with (DATA/name).open(encoding='utf-8',newline='') as f:return list(csv.DictReader(f))

def norm(v):
    s=unicodedata.normalize('NFKC',str(v or '')).strip().casefold()
    s=s.replace('’',"'").replace('‘',"'").replace('“','"').replace('”','"')
    s=re.sub(r'\s+',' ',s)
    s=re.sub(r'\s*([/+\-])\s*',r'\1',s)
    return s

def loose(v):
    s=norm(v)
    s=re.sub(r"[\'\"`´]",'',s)
    s=re.sub(r'[^a-z0-9áäčďéíľĺňóôŕšťúýž]+',' ',s)
    return re.sub(r'\s+',' ',s).strip()

def num(v):
    if v is None or str(v).strip()=='':return None
    try:return float(v)
    except:return 'INVALID'

def check_range(row,a,b,label,key):
    lo,hi=num(row.get(a)),num(row.get(b))
    if lo=='INVALID' or hi=='INVALID': errors.append(f'{key}: invalid numeric {label}')
    elif lo is not None and hi is not None and lo>hi: errors.append(f'{key}: {label} min > max')

catalog_defs=[
 ('plants.csv',('scientific_name','variant')),
 ('livestock.csv',('scientific_name','variant')),
 ('fertilizers.csv',('manufacturer','product_name','product_variant')),
 ('equipment.csv',('category','manufacturer','model','variant')),
]

for filename,keycols in catalog_defs:
    data=rows(filename); exact=[]; fuzzy=defaultdict(list)
    for i,r in enumerate(data,2):
        key=' | '.join(norm(r.get(c)) for c in keycols); exact.append(key)
        fuzzy_key=' | '.join(loose(r.get(c)) for c in keycols)
        fuzzy[fuzzy_key].append((i,key))
        status=(r.get('verification_status') or '').strip()
        if status not in ALLOWED_STATUS: errors.append(f'{filename}:{i}: unsupported verification_status={status!r}')
        if status in {'verified','verified_label_override'} and not (r.get('source_url') or '').strip(): errors.append(f'{filename}:{i}: verified row without source_url')
        if filename in ('plants.csv','livestock.csv'):
            for a,b,label in [('temperature_min','temperature_max','temperature'),('ph_min','ph_max','pH'),('gh_min','gh_max','GH'),('kh_min','kh_max','KH')]:check_range(r,a,b,label,f'{filename}:{i}')
        if filename=='livestock.csv':
            for c in ('adult_size_cm','min_tank_l','min_group_size','recommended_group_size'):
                x=num(r.get(c))
                if x=='INVALID':errors.append(f'{filename}:{i}: invalid {c}')
                elif x is not None and x<=0:errors.append(f'{filename}:{i}: non-positive {c}')
        if filename=='equipment.csv':
            for c in ('power_w','flow_l_h','volume_min_l','volume_max_l'):
                x=num(r.get(c))
                if x=='INVALID':errors.append(f'{filename}:{i}: invalid {c}')
                elif x is not None and x<0:errors.append(f'{filename}:{i}: negative {c}')
    for k,n in Counter(exact).items():
        if k and n>1:errors.append(f'{filename}: duplicate key {k!r} ({n}x)')
    for k,items in fuzzy.items():
        distinct={x[1] for x in items}
        if k and len(items)>1 and len(distinct)>1:
            warnings.append(f'{filename}: possible near-duplicate {k!r} at rows {[x[0] for x in items]}')

fert={(norm(r.get('manufacturer')),norm(r.get('product_name'))):r for r in rows('fertilizers.csv')}
nutrients=rows('fertilizer_nutrients.csv');verified_nutrients=Counter(); nutrient_keys=Counter()
for i,r in enumerate(nutrients,2):
    key=(norm(r.get('manufacturer')),norm(r.get('product_name')))
    if key not in fert:errors.append(f'fertilizer_nutrients.csv:{i}: unknown fertilizer {key}')
    nkey=(key[0],key[1],norm(r.get('nutrient_code')),norm(r.get('dose_ml')),norm(r.get('reference_volume_l')),norm(r.get('resulting_increase_mg_l')),norm(r.get('expression_basis')),norm(r.get('verification_status')))
    nutrient_keys[nkey]+=1
    status=(r.get('verification_status') or '').strip()
    if status not in ALLOWED_STATUS:errors.append(f'fertilizer_nutrients.csv:{i}: unsupported status {status!r}')
    if status in {'verified','verified_label_override'}:
        verified_nutrients[key]+=1
        if not (r.get('source_url') or '').strip():errors.append(f'fertilizer_nutrients.csv:{i}: verified nutrient without source')
    for c in ('concentration_mg_l','dose_ml','reference_volume_l','resulting_increase_mg_l'):
        x=num(r.get(c))
        if x=='INVALID':errors.append(f'fertilizer_nutrients.csv:{i}: invalid {c}')
        elif x is not None and x<0:errors.append(f'fertilizer_nutrients.csv:{i}: negative {c}')
for k,n in nutrient_keys.items():
    if n>1:errors.append(f'fertilizer_nutrients.csv: duplicate nutrient observation {k!r} ({n}x)')

for key,r in fert.items():
    if (r.get('calculation_safe') or '').strip().lower() in ('true','1','yes') and verified_nutrients[key]==0:errors.append(f'fertilizers.csv: calculation_safe without verified nutrient evidence: {key}')

# Alias collisions: one normalized alias must not point to multiple canonical targets.
try:
    aliases=rows('aliases.csv'); amap=defaultdict(set)
    for i,r in enumerate(aliases,2):
        ak=(norm(r.get('catalog')),loose(r.get('alias')))
        target=' | '.join(norm(r.get(c)) for c in ('canonical_name','variant') if c in r)
        if ak[1]:amap[ak].add(target)
    for k,targets in amap.items():
        if len(targets)>1:errors.append(f'aliases.csv: alias collision {k!r} -> {sorted(targets)}')
except FileNotFoundError:
    pass

print(f'Errors: {len(errors)}')
for e in errors:print('ERROR:',e)
print(f'Warnings: {len(warnings)}')
for w in warnings:print('WARN:',w)
print('Counts:',{n:len(rows(n)) for n in ['plants.csv','livestock.csv','fertilizers.csv','fertilizer_nutrients.csv','equipment.csv','aliases.csv'] if (DATA/n).exists()})
raise SystemExit(1 if errors else 0)
