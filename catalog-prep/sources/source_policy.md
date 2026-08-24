# Source and verification policy

## Priority by catalog

### Plants
1. Tropica official plant database
2. Dennerle Plants official profiles
3. ADA official plant/product documentation when species-specific data is published
4. Scientific botanical sources for taxonomy only
5. Specialist secondary source only for non-critical descriptive fields

Do not fabricate pH/GH/KH ranges when the primary plant source does not publish them.

### Livestock
1. FishBase / Catalog of Fishes / scientific taxonomic sources for accepted identity and taxonomy
2. SeriouslyFish or equivalent specialist husbandry source for aquarium-care ranges
3. Breeder or species-association material for shrimp/snails where appropriate
4. Retailers only for discovery, never as sole source for critical husbandry values

A husbandry range may be marked `verified` only when identity is unambiguous and the source explicitly states the value. Conflicting ranges are stored as evidence and resolved manually.

### Fertilizers
1. Manufacturer official product page
2. Manufacturer technical data sheet or label
3. Manufacturer SDS where composition is relevant and explicitly quantified
4. Official distributor documentation
5. Retailer only for product discovery

`calculation_safe=true` requires exact manufacturer-backed concentration or an explicit manufacturer dosing statement that can be represented mathematically. Marketing claims alone are never calculation-safe.

### Equipment
1. Manufacturer official product page
2. Manufacturer manual/datasheet
3. Official distributor
4. Retailer only for discovery

Model identity must include manufacturer + exact model/variant. Do not merge similarly named generations.

## Conflict handling
- Same source, different current pages: `review_required` until resolved.
- Manufacturer vs retailer: manufacturer wins unless the manufacturer page is clearly obsolete and a newer official manual exists.
- Two primary sources disagree: retain both evidence records and block automatic calculation.
- Unit conversion is allowed only when mathematically exact and the original raw value is preserved.

## Automatic-use gate
A field may affect recommendations only if:
- entity verification is `verified` or `partial`, AND
- that exact field has non-conflicting evidence, AND
- for fertilizer dose math, `calculation_safe=true`.

## Freshness
- Fertilizers/equipment: re-check at least annually or after manufacturer product revision.
- Plants/livestock husbandry: re-check when taxonomy or source profile changes.
- Every source record stores retrieval date.
