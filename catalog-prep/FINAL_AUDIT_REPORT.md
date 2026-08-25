# DuoAkva Diary – staged catalog audit

Date: 2026-08-25

This report covers only the isolated `catalog-prep` branch. Nothing in this report is deployed to production.

## Staged unique coverage

| Catalog | Existing audited rows | Additional unique candidates | Staged unique total | Target |
|---|---:|---:|---:|---:|
| Plants | 91 | 30 | 121 | >=100 |
| Livestock | 11 | 106 additional unique candidates (117 candidate identities total, including the 11 already present) | 117 | >=100 |
| Fertilizers | 22 | 91 additional unique candidates (113 candidate products total, including existing products) | 113 | >=100 |
| Equipment | 20 | 102 additional unique candidates (122 candidate models total, including existing models) | 122 | >=100 |

## Verification status

### Plants
- 91 existing rows are sourced from Tropica and marked `verified`.
- 30 additional plant identities/cultivars are staged separately for source-level verification before merging.
- No guessed pH/GH/KH limits are introduced.

### Livestock
- Existing audited dataset: 7 `verified`, 4 `partial`.
- 117 unique livestock identities are staged in the expanded candidate list.
- Candidate identities do not receive invented temperature/pH/GH/KH/minimum-volume values.
- Only verified care ranges may participate in water-parameter evaluation after deployment.

### Fertilizers
- Existing audited dataset: 20 verified/label-verified products, 2 INVITAL products remain `partial`.
- 113 unique fertilizer products are staged for catalog selection.
- Existing `calculation_safe=true` products: 13.
- Candidate fertilizer products are never calculation-safe by default. Exact dosing/nutrient effects require manufacturer/label verification.
- Flourish Potassium operational value remains 5 ml / 125 l -> +2 mg/l K, based on current bottle label confirmation; the conflicting 1.66 mg/l observation remains provenance-only.

### Equipment
- 20 existing rows have verified manufacturer specifications.
- 122 unique equipment identities/models are staged across filters, lights, heaters, dosing/controllers and pumps.
- Candidate models may be selectable after identity verification, but technical specifications remain blank until sourced from manufacturer documentation.

## Duplicate policy

Normalized uniqueness keys:
- Plants: `scientific_name + variant`
- Livestock: `scientific_name + variant`
- Fertilizers: `manufacturer + product + variant`
- Equipment: `category + manufacturer + model + variant`

The audit normalizes case, whitespace and common quote characters. Candidate files are internally duplicate-checked. Existing records win over candidates so verified data is never replaced by a lower-confidence candidate.

## Safety rule for deployment

Candidate presence is not equivalent to verified care/dosing data. Deployment must keep two concepts separate:
1. `selectable/catalog identity` – user can find the item without typing it manually;
2. `evaluation/calculation safe` – DuoAkva may use the numeric data in recommendations/calculations.

Only verified numeric fields may be used for automatic evaluation. Missing values remain null. Conflicting values remain blocked until admin review.

## User correction workflow

Prepared separately in `catalog-prep`:
- user can report an incorrect catalog value;
- fertilizer reports can include the value printed on the current bottle/label;
- reports do not modify catalog data automatically;
- admin review supports approve/reject/review;
- provenance/history is retained;
- repeated matching reports can later be grouped for easier review.

## Historical 229-livestock discrepancy

The previously mentioned count of 229 livestock entries was not the count of `catalog-prep/data/livestock.csv`. It mixed historical application/seed catalog work with the new isolated audit dataset. No 229-row audited CSV was lost. The new staged livestock catalog contains 117 unique candidate identities, of which the existing verified/partial CSV is the high-confidence subset.

## Deployment recommendation

The four catalogs now meet the requested >=100 staged unique-entry target. They are ready for a controlled merge/import design, but **not all staged candidate numeric data is verified**. Before production deployment, run `catalog-prep/validation/audit_expanded_catalogs.py`, merge candidates without overwriting verified rows, and expose unverified candidates only as selectable identities until their care/spec/dosing fields are verified.
