# DuoAkva Diary – Catalog preparation workspace

This directory is intentionally isolated on the `catalog-prep` branch. Nothing here is deployed to production until explicitly merged and applied.

## Goal
Prepare high-confidence reference catalogs for:
- plants
- livestock
- fertilizers
- equipment

## Safety rules
1. Never write to production Supabase while preparing data.
2. Every imported factual value must retain source URL, source type, retrieval date and verification status.
3. Unknown values remain NULL. Never infer chemical concentrations, pH/GH/KH ranges or equipment specifications.
4. Data used for automatic calculations requires `verified` status and a primary/manufacturer/scientific source.
5. Conflicting values are marked `review_required` and excluded from automated calculations.
6. Source records are immutable audit evidence; corrected values create a new source observation rather than overwriting provenance.

## Verification levels
- `verified`: primary manufacturer/scientific source, clear exact value, no unresolved conflict.
- `partial`: identity is verified but one or more fields are unavailable or only supported by secondary sources.
- `review_required`: conflicting or ambiguous source data.
- `unverified`: discovered name only; not eligible for biological or dosing recommendations.

## Planned deployment sequence
1. Review staging datasets.
2. Run validation report and resolve all blocking issues.
3. Generate deterministic production seed SQL.
4. Apply schema migration.
5. Import catalogs.
6. Enable autocomplete/UI integration in a separate change.
7. Smoke-test with a test account before merging to production.

## Directory layout
- `schema/` – proposed DB changes, not applied
- `data/` – staged CSV data
- `sources/` – source registry and research notes
- `validation/` – validation rules and QA checklist
- `generated/` – production SQL generated only after final review
