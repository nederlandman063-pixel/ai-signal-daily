import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Ambient } from "@/components/ambient";

export const metadata:Metadata={title:{default:"AI Signal Daily",template:"%s · AI Signal Daily"},description:"Закрытый ежедневный обзор искусственного интеллекта",robots:{index:false,follow:false,nocache:true,noarchive:true,nosnippet:true,noimageindex:true}};
export const viewport:Viewport={themeColor:"#08090b",colorScheme:"dark",width:"device-width",initialScale:1};
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="ru" data-scroll-behavior="smooth"><body><Ambient/>{children}<footer><span>AI SIGNAL DAILY</span><p>Частное издание о системах, которые меняют работу с интеллектом.</p><time>© 2026 / NO INDEX</time></footer></body></html> }
