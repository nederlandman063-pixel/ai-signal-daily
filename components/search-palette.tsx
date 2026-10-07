"use client";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Category, Story } from "@/lib/types";

type Result = { slug: string; title: string; category: Category };

export function CommandPalette({open,close,stories}:{open:boolean;close:()=>void;stories:Story[]}) {
  const [query,setQuery]=useState(""); const [remote,setRemote]=useState<Result[]>([]); const [pending,setPending]=useState(false); const input=useRef<HTMLInputElement>(null); const router=useRouter();
  useEffect(()=>{if(open)setTimeout(()=>input.current?.focus(),30)},[open]);
  useEffect(()=>{const q=query.trim();if(!open||q.length<2)return;const controller=new AbortController();const timer=setTimeout(async()=>{setPending(true);try{const response=await fetch(`/api/search?q=${encodeURIComponent(q)}`,{signal:controller.signal,cache:"no-store"});if(response.ok){const data=await response.json() as {results:Result[]};setRemote(data.results)}}catch(error){if(!controller.signal.aborted)console.error("Search failed",error)}finally{if(!controller.signal.aborted)setPending(false)}},180);return()=>{clearTimeout(timer);controller.abort()}},[query,open]);
  const results:Result[]=query.trim().length<2?stories.slice(0,5):remote;
  const go=(slug:string)=>{close();setQuery("");router.push(`/story/${slug}`)};
  return <AnimatePresence>{open&&<motion.div className="command-backdrop" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onMouseDown={close} onKeyDown={e=>e.key==="Escape"&&close()}><motion.div role="dialog" aria-modal="true" aria-label="Поиск" className="command" initial={{opacity:0,y:-20,scale:.98}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-10}} onMouseDown={e=>e.stopPropagation()}><div className="command-input"><span>⌕</span><input ref={input} value={query} onChange={e=>{setQuery(e.target.value);setRemote([])}} placeholder="Поиск по сигналам, источникам, категориям…"/><kbd>ESC</kbd></div><div className="command-label">{pending?"ИЩЕМ СИГНАЛЫ":query?`РЕЗУЛЬТАТЫ · ${results.length}`:"СЕГОДНЯ В СИГНАЛЕ"}</div><div className="command-results">{results.map((s,i)=><button key={s.slug} onClick={()=>go(s.slug)}><span className={`signal-dot ${s.category.toLowerCase()}`}/><strong>{s.title}</strong><small>{s.category}</small><em>0{i+1}</em></button>)}{!results.length&&!pending&&<p>Ничего не найдено. Попробуйте более короткий запрос.</p>}</div></motion.div></motion.div>}</AnimatePresence>;
}
