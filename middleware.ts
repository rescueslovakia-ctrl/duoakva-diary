import {createServerClient} from "@supabase/ssr";
import {NextResponse,type NextRequest} from "next/server";

const AUTH_TIMEOUT_MS=2500;

export async function middleware(request:NextRequest){
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)return NextResponse.next({request});

  let response=NextResponse.next({request});
  const supabase=createServerClient(url,key,{cookies:{
    getAll(){return request.cookies.getAll()},
    setAll(items){
      items.forEach(({name,value})=>request.cookies.set(name,value));
      response=NextResponse.next({request});
      items.forEach(({name,value,options})=>response.cookies.set(name,value,options));
    }
  }});

  // Refresh the Supabase session when possible, but never allow an auth/network
  // problem to block every route until Vercel kills the middleware invocation.
  try{
    await Promise.race([
      supabase.auth.getUser(),
      new Promise((_,reject)=>setTimeout(()=>reject(new Error("Supabase auth timeout")),AUTH_TIMEOUT_MS))
    ]);
  }catch(error){
    console.warn("Middleware auth refresh skipped:",error instanceof Error?error.message:"unknown error");
  }

  return response;
}

export const config={
  matcher:["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
