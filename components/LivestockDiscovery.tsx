"use client";

export type DiscoveryResult = {
  scientific_name?: string; common_name?: string; category?: string; adult_size_cm?: number;
  min_tank_l?: number; min_group_size?: number; recommended_group_size?: number;
  temperature_min?: number; temperature_max?: number; ph_min?: number; ph_max?: number;
  gh_min?: number; gh_max?: number; kh_min?: number; kh_max?: number;
  temperament?: string; difficulty?: string; shrimp_safe?: boolean; shrimp_safety_note?: string;
  snail_safe?: boolean; plant_safe?: boolean; diet?: string; notes?: string;
  source_name?: string; source_url?: string; verification_status?: string;
  confidence?: "high" | "medium" | "low"; match_label?: string;
};

type Props={name:string;category:string;existing?:DiscoveryResult|null;onUse:(result:DiscoveryResult)=>void};

export default function LivestockDiscovery(_props:Props){
 return <div className="notice" style={{marginTop:12}}>Online dohľadávanie údajov je vypnuté. Živočícha ulož a potom pri jeho karte použi <b>Doplniť údaje</b>. Vyplnené údaje budú platiť pre tvoje akvárium a administrátor ich môže po overení zapísať do katalógu.</div>
}
