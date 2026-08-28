import "./globals.css";
import "./context.css";
import "./public.css";
import "./feedback.css";
import "./dashboard-contrast.css";
import "./aquarium-v1.css";
import "./equipment-v1.css";
import "./fertilizer-photos.css";
export const metadata={title:"DuoAkva Diary",description:"Inteligentný akvaristický denník"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="sk"><body>{children}</body></html>}
