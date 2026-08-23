import {NextRequest,NextResponse} from "next/server";

type Candidate={scientific_name:string;common_name?:string;category:"fish";adult_size_cm?:number;temperature_min?:number;temperature_max?:number;ph_min?:number;ph_max?:number;gh_min?:number;gh_max?:number;source_name:string;source_url:string;confidence:"high"|"medium"|"low";notes?:string};
const norm=(s:string)=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
function score(name:string,q:string){const a=norm(name),b=norm(q);if(a===b)return 100;if(a.includes(b)||b.includes(a))return 80;const aw=a.split(" "),bw=b.split(" ");return bw.reduce((n,w)=>n+(aw.includes(w)?20:0),0)}
function n(v:any){const x=Number(v);return Number.isFinite(x)?x:undefined}
async function fishbase(q:string):Promise<Candidate[]>{
 const words=q.trim().split(/\s+/);const urls:string[]=[];
 if(words.length>=2)urls.push(`https://fishbase.ropensci.org/species?Genus=${encodeURIComponent(words[0])}&Species=${encodeURIComponent(words.slice(1).join(" "))}&limit=10`);
 urls.push(`https://fishbase.ropensci.org/species?Species=${encodeURIComponent(q)}&limit=10`);
 const out:Candidate[]=[];
 for(const url of urls){try{const r=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(7000)});if(!r.ok)continue;const j=await r.json();for(const x of (j.data||[])){const scientific=[x.Genus,x.Species].filter(Boolean).join(" ").trim();if(!scientific||score(scientific,q)<40)continue;out.push({scientific_name:scientific,common_name:x.FBname||x.English||undefined,category:"fish",adult_size_cm:n(x.Length),temperature_min:n(x.TempMin),temperature_max:n(x.TempMax),ph_min:n(x.pHMin),ph_max:n(x.pHMax),gh_min:n(x.dHMin),gh_max:n(x.dHMax),source_name:"Odborná databáza druhov",source_url:`https://www.fishbase.se/summary/${x.SpecCode||""}`,confidence:score(scientific,q)>=80?"high":"medium",notes:"Taxonomické a základné biologické údaje boli dohľadané online. Chovateľské minimum nádrže, veľkosť skupiny a kompatibilitu treba potvrdiť z ďalších zdrojov."})}}
 catch{}}
 return [...new Map(out.map(x=>[norm(x.scientific_name),x])).values()].sort((a,b)=>score(b.scientific_name,q)-score(a.scientific_name,q));
}
export async function GET(req:NextRequest){const q=(req.nextUrl.searchParams.get("q")||"").trim();if(q.length<3)return NextResponse.json({items:[]});try{const items=await fishbase(q);return NextResponse.json({items:items.slice(0,8),message:items.length?undefined:"Nenašla sa dostatočne presná zhoda. Skús vedecký názov druhu."})}catch(e:any){return NextResponse.json({items:[],error:e.message},{status:500})}}
