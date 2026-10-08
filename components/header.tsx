"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { Story } from "@/lib/types";
import { CommandPalette } from "./search-palette";

export function Header({stories,date}:{stories:Story[];date?:string}) {
  const path=usePathname(); const [open,setOpen]=useState(false); const [menu,setMenu]=useState(false);
  useEffect(()=>{ const key=(e:KeyboardEvent)=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();setOpen(true)}}; addEventListener("keydown",key); return()=>removeEventListener("keydown",key)},[]);
  return <><header className="site-header"><Link href="/" className="brand" aria-label="AI Signal Daily"><span>AI</span> SIGNAL<sup>DAILY</sup></Link><nav className={menu?"nav open":"nav"} aria-label="Основная навигация"><Link data-active={path==="/"} href="/">TODAY</Link><Link data-active={path.startsWith("/archive")||path.startsWith("/issue")} href="/archive">ARCHIVE</Link><Link data-active={path==="/about"} href="/about">ABOUT</Link></nav><div className="header-meta">{date&&<time>{new Date(date+"T12:00:00Z").toLocaleDateString("ru-RU",{day:"2-digit",month:"short",year:"numeric",timeZone:"UTC"}).toUpperCase()}</time>}<button className="search-trigger" onClick={()=>setOpen(true)} aria-label="Открыть поиск"><span>⌕</span><kbd>⌘ K</kbd></button><button className="menu-trigger" onClick={()=>setMenu(v=>!v)} aria-expanded={menu} aria-label="Меню"><i/><i/></button></div></header><CommandPalette open={open} close={()=>setOpen(false)} stories={stories}/></>;
}
