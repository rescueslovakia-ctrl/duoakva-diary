"use client";

import { useState } from "react";
import { Search } from "lucide-react";

type DiscoveryResult = {
  scientific_name?: string;
  common_name?: string;
  category?: string;
  adult_size_cm?: number;
  min_tank_l?: number;
  min_group_size?: number;
  recommended_group_size?: number;
  temperature_min?: number;
  temperature_max?: number;
  ph_min?: number;
  ph_max?: number;
  gh_min?: number;
  gh_max?: number;
  kh_min?: number;
  kh_max?: number;
  temperament?: string;
  difficulty?: string;
  shrimp_safe?: boolean;
  shrimp_safety_note?: string;
  snail_safe?: boolean;
  plant_safe?: boolean;
  diet?: string;
  notes?: string;
  source_name?: string;
  source_url?: string;
  verification_status?: string;
};

export default function LivestockDiscovery({
  name,
  category,
  onUse,
}: {
  name: string;
  category: string;
  onUse: (result: DiscoveryResult) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<DiscoveryResult[]>([]);

  async function discover() {
    const q = name.trim();
    if (q.length < 3) {
      setError("Zadaj aspoň 3 znaky názvu živočícha.");
      return;
    }
    setLoading(true);
    setError("");
    setResults([]);
    try {
      const r = await fetch(`/api/livestock-discovery?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}`);
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Online dohľadanie sa nepodarilo.");
      const list = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : data?.result ? [data.result] : [];
      setResults(list);
      if (!list.length) setError("Nenašli sa dostatočne spoľahlivé údaje. Skús presnejší slovenský alebo vedecký názov.");
    } catch (e: any) {
      setError(e?.message || "Online dohľadanie sa nepodarilo.");
    } finally {
      setLoading(false);
    }
  }

  const range = (a?: number, b?: number, unit = "") =>
    a == null && b == null ? "—" : a != null && b != null ? `${a}–${b}${unit}` : `${a ?? b}${unit}`;

  return (
    <div style={{ marginTop: 12 }}>
      <button type="button" onClick={discover} disabled={loading || name.trim().length < 3}>
        <Search size={16} /> {loading ? "Dohľadávam…" : "Dohľadať údaje online"}
      </button>
      {error && <p className="muted" style={{ marginTop: 8 }}>{error}</p>}
      {results.map((x, i) => (
        <div key={`${x.scientific_name || x.common_name || i}-${i}`} className="catalog-result" style={{ marginTop: 10, alignItems: "flex-start" }}>
          <div style={{ flex: 1 }}>
            <b>{x.common_name || "Nájdený živočích"}</b>
            {x.scientific_name && <p><i>{x.scientific_name}</i></p>}
            <p className="muted">
              Teplota {range(x.temperature_min, x.temperature_max, " °C")} · pH {range(x.ph_min, x.ph_max)} · GH {range(x.gh_min, x.gh_max, " °dGH")} · KH {range(x.kh_min, x.kh_max, " °dKH")}
            </p>
            {(x.min_tank_l != null || x.min_group_size != null || x.adult_size_cm != null) && (
              <p className="muted">
                {x.adult_size_cm != null ? `Max. veľkosť ${x.adult_size_cm} cm · ` : ""}
                {x.min_tank_l != null ? `nádrž od ${x.min_tank_l} l · ` : ""}
                {x.min_group_size != null ? `min. skupina ${x.min_group_size} ks` : ""}
              </p>
            )}
            {x.shrimp_safety_note && <p>🦐 {x.shrimp_safety_note}</p>}
            {x.notes && <p className="muted">{x.notes}</p>}
            <p className="muted">Údaje nájdené online; pred uložením ich používateľ potvrdí.</p>
          </div>
          <button type="button" className="primary" onClick={() => onUse(x)}>Použiť nájdené údaje</button>
        </div>
      ))}
    </div>
  );
}
