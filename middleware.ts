import {createServerClient} from '@supabase/ssr';
import {NextResponse,type NextRequest} from 'next/server';

const protectedDiscoveryRoutes=new Set([
  '/api/plant-discovery',
  '/api/livestock-discovery',
  '/api/fertilizer-discovery'
]);

export async function middleware(request:NextRequest){
  let response=NextResponse.next({request});
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if(!url||!key)return response;

  const supabase=createServerClient(url,key,{
    cookies:{
      getAll(){return request.cookies.getAll()},
      setAll(cookiesToSet){
        cookiesToSet.forEach(({name,value})=>request.cookies.set(name,value));
        response=NextResponse.next({request});
        cookiesToSet.forEach(({name,value,options})=>response.cookies.set(name,value,options));
      }
    }
  });

  // getUser overí a podľa potreby obnoví session; cookie zmeny sa prenesú do response.
  const{data:{user}}=await supabase.auth.getUser();
  if(protectedDiscoveryRoutes.has(request.nextUrl.pathname)&&!user){
    return NextResponse.json({error:'Neprihlásený používateľ.'},{status:401});
  }
  return response;
}

export const config={
  matcher:['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)']
};
