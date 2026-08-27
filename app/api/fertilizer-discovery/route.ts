import {NextResponse} from "next/server";

export const dynamic="force-dynamic";

export async function GET(){
  return NextResponse.json({
    items:[],
    message:"Online overovanie hnojív je vypnuté. Ak produkt nie je v katalógu, pridaj ho manuálne a opíš dávkovanie a účinky priamo z etikety výrobcu. Po tvojom potvrdení môže aplikácia údaje použiť iba pre tvoje akvárium; po schválení administrátorom sa zapíšu do spoločného katalógu."
  });
}
