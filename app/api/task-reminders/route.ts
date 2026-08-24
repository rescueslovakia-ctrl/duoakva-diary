import {NextRequest} from "next/server";
import {createClient} from "@supabase/supabase-js";
import nodemailer from "nodemailer";

export const runtime="nodejs";
export const dynamic="force-dynamic";

const TZ="Europe/Bratislava";

type TaskRow={id:string;title:string;notes:string|null;due_at:string|null;aquariums:{name:string;user_id:string}|{name:string;user_id:string}[]|null};

function dateKey(d:Date){
 const parts=new Intl.DateTimeFormat("en-GB",{timeZone:TZ,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(d);
 const get=(t:string)=>parts.find(p=>p.type===t)?.value||"";
 return `${get("year")}-${get("month")}-${get("day")}`;
}
function localTime(s:string){return new Intl.DateTimeFormat("sk-SK",{timeZone:TZ,hour:"2-digit",minute:"2-digit"}).format(new Date(s))}
function esc(s:string){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]||c))}
function aquariumOf(t:TaskRow){return Array.isArray(t.aquariums)?t.aquariums[0]:t.aquariums}

function adminClient(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error("missing_supabase_server_config");
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
function mailer(){
 const host=process.env.SMTP_HOST;const user=process.env.SMTP_USER;const pass=process.env.SMTP_PASS;const port=Number(process.env.SMTP_PORT||587);
 if(!host||!user||!pass)throw new Error("missing_smtp_config");
 return nodemailer.createTransport({host,port,secure:port===465,auth:{user,pass},requireTLS:port===587});
}

async function tasksForUser(s:ReturnType<typeof adminClient>,userId:string,today:string){
 const from=new Date(Date.now()-36*3600_000).toISOString();
 const to=new Date(Date.now()+36*3600_000).toISOString();
 const{data,error}=await s.from("aquarium_tasks").select("id,title,notes,due_at,aquariums!inner(name,user_id)").eq("status","open").eq("aquariums.user_id",userId).not("due_at","is",null).gte("due_at",from).lte("due_at",to).order("due_at");
 if(error)throw error;
 return ((data||[]) as unknown as TaskRow[]).filter(t=>t.due_at&&dateKey(new Date(t.due_at))===today);
}

async function sendOne(s:ReturnType<typeof adminClient>,userId:string,today:string,ignoreDedupe=false){
 const{data:profile}=await s.from("profiles").select("email_task_notifications").eq("id",userId).maybeSingle();
 if(!profile?.email_task_notifications)return {status:"disabled" as const};
 const tasks=await tasksForUser(s,userId,today);
 if(!tasks.length)return {status:"no_tasks" as const};
 if(!ignoreDedupe){const{data:log}=await s.from("task_email_reminder_log").select("id").eq("user_id",userId).eq("reminder_date",today).maybeSingle();if(log)return {status:"already_sent" as const}}
 const{data:userData,error:userError}=await s.auth.admin.getUserById(userId);if(userError)throw userError;
 const email=userData.user?.email;if(!email)return {status:"no_email" as const};
 const list=tasks.map(t=>{const aq=aquariumOf(t);return `<li style="margin:0 0 12px"><b>${esc(t.title)}</b><br><span>${esc(aq?.name||"Akvárium")} · ${t.due_at?localTime(t.due_at):""}</span>${t.notes?`<br><span style="color:#64748b">${esc(t.notes)}</span>`:""}</li>`}).join("");
 const html=`<!doctype html><html><body style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5"><div style="max-width:620px;margin:auto;padding:24px"><h2 style="margin-bottom:6px">DuoAkva Diary</h2><p>Dnes máš naplánované ${tasks.length===1?"1 otvorenú úlohu":`${tasks.length} otvorené úlohy`}:</p><ul style="padding-left:22px">${list}</ul><p><a href="https://diary.duoakva.sk" style="display:inline-block;padding:10px 16px;background:#0f766e;color:white;text-decoration:none;border-radius:8px">Otvoriť DuoAkva Diary</a></p><hr style="border:0;border-top:1px solid #e2e8f0;margin:24px 0"><small style="color:#64748b">Tento e-mail dostávaš, pretože máš v nastaveniach zapnuté e-mailové upozornenia na úlohy. Upozornenia môžeš kedykoľvek vypnúť v Nastaveniach.</small></div></body></html>`;
 const from=process.env.SMTP_FROM||process.env.SMTP_USER!;
 await mailer().sendMail({from,to:email,subject:`DuoAkva Diary – dnešné úlohy (${tasks.length})`,html,text:`DuoAkva Diary – dnešné úlohy:\n\n${tasks.map(t=>`• ${t.title} – ${aquariumOf(t)?.name||"Akvárium"}${t.due_at?` o ${localTime(t.due_at)}`:""}`).join("\n")}\n\nhttps://diary.duoakva.sk`});
 if(!ignoreDedupe)await s.from("task_email_reminder_log").insert({user_id:userId,reminder_date:today,task_count:tasks.length});
 return {status:"sent" as const,count:tasks.length};
}

export async function GET(req:NextRequest){
 const secret=process.env.CRON_SECRET;
 if(!secret||req.headers.get("authorization")!==`Bearer ${secret}`)return Response.json({ok:false,error:"unauthorized"},{status:401});
 try{
  const s=adminClient();const today=dateKey(new Date());const{data:profiles,error}=await s.from("profiles").select("id").eq("email_task_notifications",true);if(error)throw error;
  const summary={sent:0,noTasks:0,alreadySent:0,failed:0};
  for(const p of profiles||[]){try{const r=await sendOne(s,p.id,today);if(r.status==="sent")summary.sent++;else if(r.status==="no_tasks")summary.noTasks++;else if(r.status==="already_sent")summary.alreadySent++}catch(e){summary.failed++;console.error("task-reminder-user-failed",p.id,e)}}
  return Response.json({ok:true,date:today,...summary});
 }catch(e){console.error("task-reminders-failed",e);return Response.json({ok:false,error:e instanceof Error?e.message:"unknown_error"},{status:500})}
}
