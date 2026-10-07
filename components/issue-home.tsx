"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useMemo, useState, ViewTransition } from "react";
import type { Category, Issue, Story } from "@/lib/types";
import { categories } from "@/lib/types";

const labels: Record<Category, string> = {
  MODELS: "МОДЕЛИ", AGENTS: "АГЕНТЫ", APPS: "ПРИЛОЖЕНИЯ",
  RESEARCH: "ИССЛЕДОВАНИЯ", BUSINESS: "БИЗНЕС", INFRA: "ИНФРА",
};

export function IssueHome({ issue }: { issue: Issue }) {
  const reduce = useReducedMotion();
  const [filter, setFilter] = useState<Category | "ALL">("ALL");
  const [shuffle, setShuffle] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const visible = useMemo(() => {
    const list = filter === "ALL" ? issue.stories : issue.stories.filter(s => s.category === filter);
    if (shuffle === 0) return list;
    return [...list].sort((a, b) => ((a.rank * 7 + shuffle * 3) % 11) - ((b.rank * 7 + shuffle * 3) % 11));
  }, [filter, issue.stories, shuffle]);
  const counts = categories.map(category => ({ category, count: issue.stories.filter(s => s.category === category).length })).filter(x => x.count);

  async function share(story: Story) {
    const url = `${location.origin}/story/${story.slug}`;
    try {
      if (navigator.share) await navigator.share({ title: story.title, url });
      else await navigator.clipboard.writeText(url);
    } catch (error) {
      if ((error as Error).name !== "AbortError") console.error("Share failed", error);
    }
  }

  return <main>
    {issue.demo && <div className="demo-banner">ДЕМО · ВЫМЫШЛЕННЫЕ СЮЖЕТЫ · ТОЛЬКО ДЛЯ ЛОКАЛЬНОЙ ПРОВЕРКИ</div>}
    <section className="issue-intro">
      <div><div className="eyebrow"><i />ISSUE / {issue.date.replaceAll("-", ".")}</div><h1>{issue.title}</h1><p>{issue.summary}</p></div>
      <SignalRadar counts={counts} />
    </section>
    <section className="control-rail">
      <div className="filters" aria-label="Фильтр категорий">
        <button data-active={filter === "ALL"} onClick={() => setFilter("ALL")}>ВСЕ <sup>{issue.stories.length}</sup></button>
        {categories.map(category => <button key={category} className={category.toLowerCase()} data-active={filter === category} onClick={() => setFilter(category)}>{labels[category]} <sup>{issue.stories.filter(s => s.category === category).length}</sup></button>)}
      </div>
      <button className="shuffle" onClick={() => setShuffle(value => value + 1)}><span>⤨</span> SHUFFLE SIGNALS <em>{String(shuffle + 1).padStart(2, "0")}</em></button>
    </section>
    <motion.section layout={!reduce} className={`story-grid shuffle-${shuffle % 3}`}>
      {visible.length === 0 && <p className="no-signals">В этой категории сегодня нет сигналов.</p>}
      <AnimatePresence mode="popLayout">
        {visible.map((story, index) => <motion.article
          layout={!reduce} key={story.slug}
          className={`story-card card-${index} ${story.lead && filter === "ALL" && shuffle === 0 ? "lead" : ""} ${story.category.toLowerCase()} ${expanded === story.slug ? "expanded" : ""}`}
          initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: .95 }}
          transition={{ type: "spring", stiffness: 210, damping: 26 }}>
          <ViewTransition name={`image-${story.slug}`}><Link href={`/story/${story.slug}`} className="card-media" aria-label={`Читать: ${story.title}`}>
            <Image src={story.image.url} alt={story.image.alt} fill sizes={story.lead ? "(max-width: 800px) 100vw, 66vw" : "(max-width: 800px) 100vw, 40vw"} priority={story.lead} unoptimized={story.image.url.startsWith("http")} referrerPolicy="no-referrer" />
            <div className="image-wash" /><span className="index">{String(story.rank).padStart(2, "0")}</span>
          </Link></ViewTransition>
          <div className="card-copy">
            <div className="story-meta"><span>{story.category}</span><time>{new Date(story.publishedAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })} UTC</time><i>{story.readTime} МИН</i></div>
            <Link href={`/story/${story.slug}`}><ViewTransition name={`title-${story.slug}`}><h2>{story.title}</h2></ViewTransition></Link>
            <p className="dek">{story.dek}</p>
            <span className="card-source">{story.sources[0]?.label ?? "ДЕМО / БЕЗ ИСТОЧНИКА"}</span>
            <div className="reveal"><p>{story.excerpt}</p><div><Link href={`/story/${story.slug}`} className="read-link">READ ARTICLE <span>↗</span></Link><button onClick={() => share(story)}>SHARE <span>⌁</span></button></div></div>
            <button className="touch-expand" onClick={() => setExpanded(expanded === story.slug ? null : story.slug)} aria-expanded={expanded === story.slug}>{expanded === story.slug ? "СВЕРНУТЬ" : "ПОКАЗАТЬ ФАКТЫ"}</button>
          </div>
        </motion.article>)}
      </AnimatePresence>
    </motion.section>
    <SignalTimeline stories={issue.stories} />
  </main>;
}

function SignalRadar({ counts }: { counts: { category: Category; count: number }[] }) {
  const total = counts.reduce((sum, item) => sum + item.count, 0);
  return <aside className="radar"><div className="radar-head"><span>SIGNAL RADAR</span><em>LIVE</em></div><div className="radar-body"><svg viewBox="0 0 180 180" role="img" aria-label="Распределение сигналов по категориям"><circle cx="90" cy="90" r="72" /><circle cx="90" cy="90" r="47" /><circle cx="90" cy="90" r="22" /><path d="M90 12V168M12 90H168M35 35l110 110M145 35L35 145" />{counts.map((item, i) => { const angle = i / counts.length * Math.PI * 2 - Math.PI / 2, radius = 30 + item.count * 20; return <g key={item.category}><line x1="90" y1="90" x2={90 + Math.cos(angle) * radius} y2={90 + Math.sin(angle) * radius} /><circle className={item.category.toLowerCase()} cx={90 + Math.cos(angle) * radius} cy={90 + Math.sin(angle) * radius} r="4" /></g>; })}<circle className="sweep" cx="90" cy="90" r="67" /></svg><div>{counts.map(item => <span key={item.category}><i className={item.category.toLowerCase()} />{item.category}<b>{item.count}</b></span>)}<small>TOTAL SIGNALS <b>{total}</b></small></div></div></aside>;
}

function SignalTimeline({ stories }: { stories: Story[] }) {
  return <section className="timeline"><div className="section-label"><span>24H SIGNAL TIMELINE</span><i /></div><div className="timeline-line">{stories.slice().reverse().map((story, i) => <div key={story.slug} className={story.category.toLowerCase()} style={{ left: `${6 + i * (88 / Math.max(1, stories.length - 1))}%` }}><i /><time>{new Date(story.publishedAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", timeZone: "UTC" })}</time><span>{story.title}</span></div>)}</div></section>;
}
