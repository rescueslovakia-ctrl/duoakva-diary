export const runtime="nodejs";
export const dynamic="force-dynamic";

export async function GET(){
 return Response.json({items:[],message:"Online dohľadávanie rastlín bolo vypnuté. Údaje doplň ručne v aplikácii."},{status:410});
}
