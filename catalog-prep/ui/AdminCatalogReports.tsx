"use client";

// PREPARATION-ONLY COMPONENT. Not imported by production app.
// Intended menu: Admin -> Hlásenia údajov

type Report={id:string;entity_type:string;entity_key:string;report_type:string;current_value:string|null;proposed_value:string;package_label_text:string|null;user_note:string|null;evidence_image_path:string|null;status:string;created_at:string;matching_reports?:number};
type Props={reports:Report[];onReview?:(id:string,status:'approved'|'rejected'|'needs_review',note?:string)=>Promise<void>};

export default function AdminCatalogReports({reports,onReview}:Props){
 const pending=reports.filter(r=>['pending','needs_review'].includes(r.status));
 return <section className="card"><div className="section-head"><div><small>ADMIN</small><h3>Hlásenia údajov</h3></div><span className="status-pill status-neutral">{pending.length} otvorených</span></div><p className="muted">Schválenie hlásenia nesmie priamo meniť katalóg bez vytvorenia auditnej revízie zdrojov. Pri hnojivách sa pred publikovaním znovu overí výrobca a podľa potreby INVITAL.</p>{pending.length===0?<div className="notice">Žiadne hlásenia čakajúce na kontrolu.</div>:<div className="catalog-report-list">{pending.map(r=><article className="card" key={r.id}><div className="section-head"><div><b>{r.entity_key}</b><div className="muted">{r.entity_type} · {new Date(r.created_at).toLocaleDateString('sk-SK')}</div></div>{(r.matching_reports||1)>1&&<span className="status-pill status-green">{r.matching_reports} zhodných hlásení</span>}</div>{r.current_value&&<p>Aktuálne: <code>{r.current_value}</code></p>}<p>Navrhované: <b>{r.proposed_value}</b></p>{r.package_label_text&&<div className="notice"><b>Text z etikety:</b><br/>{r.package_label_text}</div>}{r.user_note&&<p>{r.user_note}</p>}{r.evidence_image_path&&<p>📷 Priložená fotografia etikety</p>}<div className="form-actions"><button type="button" onClick={()=>onReview?.(r.id,'approved')}>Schváliť po overení</button><button type="button" onClick={()=>onReview?.(r.id,'needs_review')}>Na preverenie</button><button type="button" onClick={()=>onReview?.(r.id,'rejected')}>Zamietnuť</button></div></article>)}</div>}</section>;
}
