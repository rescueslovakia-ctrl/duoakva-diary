import {type EmailOtpType} from "@supabase/supabase-js";
import {NextRequest,NextResponse} from "next/server";
import {createServerSupabaseClient} from "@/lib/supabase/server";

export async function GET(request:NextRequest){
 const tokenHash=request.nextUrl.searchParams.get("token_hash");
 const type=request.nextUrl.searchParams.get("type") as EmailOtpType|null;
 const next=request.nextUrl.searchParams.get("next")||"/";
 const redirectTo=request.nextUrl.clone();
 redirectTo.pathname=next.startsWith("/")?next:"/";
 redirectTo.searchParams.delete("token_hash");
 redirectTo.searchParams.delete("type");
 redirectTo.searchParams.delete("next");
 if(tokenHash&&type){
  const s=await createServerSupabaseClient();
  const{error}=await s.auth.verifyOtp({token_hash:tokenHash,type});
  if(!error)return NextResponse.redirect(redirectTo);
 }
 redirectTo.pathname="/auth";
 redirectTo.searchParams.set("error","confirmation_failed");
 return NextResponse.redirect(redirectTo);
}
