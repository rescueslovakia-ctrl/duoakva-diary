# Catalog QA checklist

## Blocking checks before any production import
- [ ] No duplicate canonical keys.
- [ ] No `verified` row without source URL.
- [ ] No fertilizer with `calculation_safe=true` unless at least one exact dose/concentration evidence row is verified.
- [ ] No pH/GH/KH/temperature range where min > max.
- [ ] No livestock minimum group size below 1.
- [ ] No equipment model merged across different generations/variants.
- [ ] No plant cultivar collapsed into its parent species when care requirements differ.
- [ ] No unresolved source conflict on a field used by recommendations.
- [ ] Every unit conversion is reproducible from preserved raw evidence.
- [ ] Every import is idempotent and can be rerun safely.

## Biological sanity checks
- Flag fish adult size <= 0 or > 500 cm.
- Flag freshwater pH outside 3.0–10.0 for manual review.
- Flag GH/KH < 0.
- Flag temperature outside 0–40 °C for tropical aquarium species unless explicitly justified.
- Flag min tank volume <= 0.

## Fertilizer sanity checks
- Reject negative concentrations or dose values.
- Keep P and PO4 distinct; keep N and NO3 distinct; keep elemental K distinct from K2O.
- Store the expression basis exactly (e.g. elemental P, PO4, P2O5, N, NO3, K, K2O).
- Do not silently convert guaranteed analysis to aquarium concentration unless the chemistry and density assumptions are explicit and verified.
- Prefer manufacturer-stated aquarium dose effect over derived chemistry when both are available and consistent.

## Equipment sanity checks
- Flag flow <= 0 for powered filters/pumps.
- Flag wattage <= 0 for powered devices.
- Preserve manufacturer-rated flow separately from any real-world estimate.

## Release report
Before deployment generate a report containing:
- row count per catalog
- verified / partial / review_required / unverified counts
- all conflicts
- all calculation-safe fertilizers
- all rows with missing critical fields
- duplicate candidates
- source domains used and their row counts
