import {NextRequest,NextResponse} from "next/server";

type Candidate={scientific_name:string;common_name?:string;category:"fish"|"shrimp"|"snail"|"other";adult_size_cm?:number;min_tank_l?:number;min_group_size?:number;temperature_min?:number;temperature_max?:number;ph_min?:number;ph_max?:number;gh_min?:number;gh_max?:number;kh_min?:number;kh_max?:number;shrimp_safe?:boolean;snail_safe?:boolean;plant_safe?:boolean;source_name:string;source_url:string;confidence:"high"|"medium"|"low";notes?:string};
const norm=(s:string)=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g," ").trim();
function score(name:string,q:string){const a=norm(name),b=norm(q);if(a===b)return 100;if(a.includes(b)||b.includes(a))return 80;const aw=a.split(" "),bw=b.split(" ");return bw.reduce((n,w)=>n+(aw.includes(w)?20:0),0)}
function n(v:any){const x=Number(v);return Number.isFinite(x)?x:undefined}

// Curated husbandry records are deliberately preferred over inferred values.
// GH/KH values stated only as an upper limit remain min=undefined.
const verified:Candidate[]=[
 {scientific_name:"Paracheirodon axelrodi",common_name:"Neonka červená",category:"fish",adult_size_cm:5,min_tank_l:50,min_group_size:10,temperature_min:23,temperature_max:27,ph_min:6,ph_max:7,gh_min:5,gh_max:10,shrimp_safe:true,snail_safe:true,plant_safe:true,source_name:"Overený chovateľský zdroj",source_url:"https://www.shrimp.sk/paracheirodon-axelrodi",confidence:"high",notes:"Mierumilovná húfová tetra. Vhodná k dospelým a väčším krevetám; môže loviť čerstvo narodené a veľmi malé trpasličie krevetky."},
 {scientific_name:"Neocaridina davidi",common_name:"Neocaridina",category:"shrimp",adult_size_cm:3,temperature_min:18,temperature_max:28,ph_min:6.8,ph_max:8,gh_max:20,kh_max:12,shrimp_safe:true,snail_safe:true,plant_safe:true,source_name:"Overený chovateľský zdroj",source_url:"https://www.shrimp.sk/neocaridina-red-cherry",confidence:"high",notes:"Veľmi pokojná a mierumilovná. GH do 20 °dGH a KH do 12 °dKH sú horné limity, nie optimum od nuly."}
];
function verifiedMatches(q:string){return verified.filter(x=>Math.max(score(x.scientific_name,q),score(x.common_name||"",q))>=40).sort((a,b)=>Math.max(score(b.scientific_name,q),score(b.common_name||"",q))-Math.max(score(a.scientific_name,q),score(a.common_name||"",q)))}
async function fishbase(q:string):Promise<Candidate[]>{
 const words=q.trim().split(/\s+/);const urls:string[]=[];
 if(words.length>=2)urls.push(`https://fishbase.ropensci.org/species?Genus=${encodeURIComponent(words[0])}&Species=${encodeURIComponent(words.slice(1).join(" "))}&limit=10`);
 urls.push(`https://fishbase.ropensci.org/species?Species=${encodeURIComponent(q)}&limit=10`);
 const out:Candidate[]=[];
 for(const url of urls){try{const r=await fetch(url,{cache:"no-store",signal:AbortSignal.timeout(7000)});if(!r.ok)continue;const j=await r.json();for(const x of (j.data||[])){const scientific=[x.Genus,x.Species].filter(Boolean).join(" ").trim();if(!scientific||score(scientific,q)<40)continue;out.push({scientific_name:scientific,common_name:x.FBname||x.English||undefined,category:"fish",adult_size_cm:n(x.Length),temperature_min:n(x.TempMin),temperature_max:n(x.TempMax),ph_min:n(x.pHMin),ph_max:n(x.pHMax),gh_min:n(x.dHMin),gh_max:n(x.dHMax),source_name:"Doplnková odborná databáza",source_url:`https://www.fishbase.se/summary/${x.SpecCode||""}`,confidence:score(scientific,q)>=80?"high":"medium",notes:"Doplnkové taxonomické a biologické údaje. Chovateľské minimum nádrže, skupinu a kompatibilitu nepotvrdzujeme bez chovateľského zdroja."})}}
 catch{}}
 return [...new Map(out.map(x=>[norm(x.scientific_name),x])).values()].sort((a,b)=>score(b.scientific_name,q)-score(a.scientific_name,q));
}
export async function GET(req:NextRequest){const q=(req.nextUrl.searchParams.get("q")||"").trim();if(q.length<3)return NextResponse.json({items:[]});try{const primary=verifiedMatches(q);const secondary=await fishbase(q);const seen=new Set(primary.map(x=>norm(x.scientific_name)));const items=[...primary,...secondary.filter(x=>!seen.has(norm(x.scientific_name)))];return NextResponse.json({items:items.slice(0,8),message:items.length?undefined:"Nenašla sa dostatočne presná zhoda. Skús slovenský, bežný alebo vedecký názov druhu."})}catch(e:any){return NextResponse.json({items:[],error:e.message},{status:500})}}
