export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(){
 return Response.json({items:[],message:"Online dohľadávanie živočíchov bolo vypnuté. Údaje doplň ručne v aplikácii."},{status:410});
}
