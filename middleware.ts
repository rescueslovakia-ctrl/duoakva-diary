import {createServerClient} from "@supabase/ssr";
import {NextResponse,type NextRequest} from "next/server";

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

  // Do not refresh auth on the login page itself. Login is handled by the
  // browser Supabase client and must be allowed to finish without middleware
  // competing with the newly-created session cookies.
  if(request.nextUrl.pathname.startsWith('/auth'))return response;

  try{
    await supabase.auth.getUser();
  }catch(error){
    console.warn('Supabase session refresh failed',error);
  }
  return response;
}

export const config={
  matcher:["/((?!auth(?:/|$)|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
