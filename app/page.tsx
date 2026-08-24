import App from "@/components/App";
import LandingPage from "@/components/LandingPage";
import {createServerSupabaseClient} from "@/lib/supabase/server";

export default async function Page(){
 try{const supabase=await createServerSupabaseClient();const{data:{user}}=await supabase.auth.getUser();return user?<App/>:<LandingPage/>}catch{return <LandingPage/>}
}
