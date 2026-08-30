import {createServerSupabaseClient} from "@/lib/supabase/server";
import nodemailer from "nodemailer";

export const runtime="nodejs";
export const dynamic="force-dynamic";

function mailer(){
 const host=process.env.SMTP_HOST, user=process.env.SMTP_USER, pass=process.env.SMTP_PASS;
 const port=Number(process.env.SMTP_PORT||587);
 if(!host||!user||!pass)throw new Error("missing_smtp_config");
 return nodemailer.createTransport({host,port,secure:port===465,auth:{user,pass},requireTLS:port===587});
}
function esc(v:string){return v.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]||c))}
const labels:Record<string,string>={feedback:"Spätná väzba",bug:"Nahlásená chyba",idea:"Nápad na funkciu"};

export async function POST(req:Request){
 const s=await createServerSupabaseClient();
 const{data:{user}}=await s.auth.getUser();
 if(!user)return Response.json({ok:false,error:"unauthorized"},{status:401});
 const b=await req.json().catch(()=>null) as any;
 const category=["feedback","bug","idea"].includes(String(b?.category))?String(b.category):"feedback";
 const message=String(b?.message||"").trim().slice(0,2000);
 const page=String(b?.page||"").trim().slice(0,120)||null;
 if(message.length<3)return Response.json({ok:false,error:"message_too_short"},{status:400});
 const email=user.email||null;
 const{data:row,error}=await s.from("user_feedback").insert({user_id:user.id,email,category,message,page,status:"new"}).select("id,created_at").single();
 if(error)return Response.json({ok:false,error:error.message},{status:500});
 let emailSent=false;
 try{
  const to=process.env.FEEDBACK_NOTIFY_TO||"info@duoakva.sk";
  const from=process.env.SMTP_FROM||process.env.SMTP_USER!;
  const title=labels[category]||"Feedback";
  const html=`<!doctype html><html><body style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5"><div style="max-width:640px;margin:auto;padding:24px"><h2>DuoAkva Diary – nový feedback</h2><p><b>Typ:</b> ${esc(title)}<br><b>Používateľ:</b> ${esc(email||user.id)}<br><b>Sekcia:</b> ${esc(page||"nezadaná")}</p><div style="padding:16px;background:#f1f5f9;border-radius:10px;white-space:pre-wrap">${esc(message)}</div><p style="margin-top:20px"><a href="https://diary.duoakva.sk" style="display:inline-block;padding:10px 16px;background:#0f766e;color:#fff;text-decoration:none;border-radius:8px">Otvoriť DuoAkva Diary</a></p><small style="color:#64748b">Ref: ${row.id}</small></div></body></html>`;
  await mailer().sendMail({from,to,replyTo:email||undefined,subject:`DuoAkva Diary – ${title}`,html,text:`DuoAkva Diary – ${title}\nPoužívateľ: ${email||user.id}\nSekcia: ${page||"nezadaná"}\n\n${message}\n\nRef: ${row.id}`});
  emailSent=true;
 }catch(e){console.error("feedback-email-failed",e)}
 return Response.json({ok:true,id:row.id,emailSent});
}
