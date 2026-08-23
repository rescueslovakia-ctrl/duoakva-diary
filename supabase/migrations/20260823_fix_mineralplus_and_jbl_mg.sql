update public.water_treatment_catalog
set kh_increase=0.5,
    gh_increase=1.4,
    reference_dose=5.5,
    reference_liters=100,
    notes='Zarovnaná odmerka má 5,5 g. Podľa tabuľky výrobcu pri 100 l jedna odmerka zvyšuje GH približne o 1,4 °dGH a KH o 0,5 °dKH.',
    verification_status='verified'
where lower(coalesce(manufacturer,''))='invital'
  and lower(product_name) like '%mineralplus%gh%kh%';

update public.fertilizer_catalog
set nutrient_effects=jsonb_build_object('mg',0.625),
    declared_composition=jsonb_build_object('mg',jsonb_build_object('declared',true,'value',12.5,'unit','mg/ml')),
    description='Horčíkové hnojivo. Overený účinok dávky je vedený iba pre Mg.',
    dosing_instructions='5 ml na 100 l zvýši Mg približne o 0,625 mg/l.',
    verification_status='verified',
    enrichment_status='confirmed',
    enrichment_checked_at=now()
where lower(coalesce(manufacturer,''))='jbl'
  and lower(product_name) like '%proscape%mg%macroelement%';