import Image from "next/image";
import Link from "next/link";
import { getArchive } from "@/lib/db";
import type { ArchiveEntry } from "@/lib/types";

export const metadata={title:"Архив"};
export const dynamic="force-dynamic";

function Month({issues}:{issues:ArchiveEntry[]}) {
  const date=new Date(`${issues[0].date}T12:00:00Z`);
  return <section><div className="year"><span>{date.toLocaleDateString("ru-RU",{month:"long",year:"numeric",timeZone:"UTC"}).toUpperCase()}</span><i/></div><div className="archive-list">{issues.map((issue,i)=><Link href={`/issue/${issue.date}`} className="archive-card" key={issue.date}><div className="archive-image"><Image src={issue.leadImageUrl} alt="" fill sizes="300px" unoptimized={issue.leadImageUrl.startsWith("http")} referrerPolicy="no-referrer"/></div><time>{new Date(`${issue.date}T12:00:00Z`).toLocaleDateString("ru-RU",{day:"2-digit",month:"long",timeZone:"UTC"})}</time><div><small>{issue.demo?"ДЕМО":`ISSUE ${String(issues.length-i).padStart(3,"0")}`}</small><h2>{issue.title}</h2><p>{issue.storyCount} сигналов</p></div><div className="archive-cats">{issue.categories.map(c=><i key={c} className={c.toLowerCase()} title={c}/>)}</div><span className="arrow">↗</span></Link>)}</div></section>;
}

export default async function Archive({searchParams}:{searchParams:Promise<{page?:string}>}) {
  const raw=Number((await searchParams).page??"1");
  const page=Number.isInteger(raw)&&raw>0&&raw<10000?raw:1;
  const {items:issues,hasMore}=await getArchive(page);
  const groups=new Map<string,ArchiveEntry[]>();
  issues.forEach(issue=>{const key=issue.date.slice(0,7);groups.set(key,[...(groups.get(key)??[]),issue])});
  return <main className="archive-page"><div className="eyebrow"><i/>SIGNAL MEMORY</div><div className="archive-title"><h1>Архив</h1><p>Ежедневная карта изменений в искусственном интеллекте.</p></div>{groups.size?Array.from(groups.entries()).map(([key,items])=><Month key={key} issues={items}/>):<p className="archive-empty">Опубликованных выпусков пока нет.</p>}{(page>1||hasMore)&&<nav className="archive-pagination" aria-label="Страницы архива">{page>1&&<Link href={`/archive?page=${page-1}`}>← НОВЕЕ</Link>}<span>СТРАНИЦА {page}</span>{hasMore&&<Link href={`/archive?page=${page+1}`}>СТАРШЕ →</Link>}</nav>}</main>;
}
