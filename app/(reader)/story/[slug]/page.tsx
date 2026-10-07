import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { getStory } from "@/lib/db";
import { ReadingProgress, ShareButton } from "@/components/article-tools";
import type { Verification } from "@/lib/types";

export const dynamic = "force-dynamic";

const verification: Record<Verification, string> = {
  CONFIRMED: "ПОДТВЕРЖДЕНО", COMPANY_CLAIM: "ЗАЯВЛЕНИЕ КОМПАНИИ", ANALYSIS: "АНАЛИЗ",
};

export const metadata = { title: "Статья", description: "Закрытая публикация AI Signal Daily", robots: { index: false, follow: false } };

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const story = await getStory((await params).slug);
  if (!story) notFound();
  const paragraphs = story.body.split("\n\n");
  return <main className={`article-page ${story.category.toLowerCase()}`}>
    {story.demo && <div className="demo-banner">ДЕМО · ВЫМЫШЛЕННЫЙ ТЕКСТ · НЕ ПУБЛИКАЦИЯ</div>}
    <ReadingProgress />
    <div className="article-top"><Link href="/" className="back">← К ВЫПУСКУ</Link><ShareButton title={story.title} /></div>
    <header className="article-header">
      <div className="article-meta"><span>{story.category}</span><time>{new Date(story.publishedAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).toUpperCase()}</time><i>{story.readTime} МИН ЧТЕНИЯ</i></div>
      <ViewTransition name={`title-${story.slug}`}><h1>{story.title}</h1></ViewTransition>
      <p>{story.dek}</p>
    </header>
    <ViewTransition name={`image-${story.slug}`}><figure className="article-hero"><Image src={story.image.url} alt={story.image.alt} fill priority sizes="100vw" unoptimized={story.image.url.startsWith("http")} referrerPolicy="no-referrer" /><figcaption>{story.image.credit}</figcaption></figure></ViewTransition>
    <div className="article-layout">
      <aside><span>В ЭТОМ МАТЕРИАЛЕ</span><a href="#article">Суть сигнала</a><a href="#takeaway">Что это меняет</a><a href="#sources">Источники</a></aside>
      <article id="article" className="article-body">
        {paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
        <section className="takeaway" id="takeaway"><div className="takeaway-mark">?</div><div><span>PRACTICAL SIGNAL</span><h2>А что мне с этого?</h2><p>{story.takeaway}</p></div></section>
        <section className="sources" id="sources">
          <div className="section-label"><span>SOURCES / ИСТОЧНИКИ</span><i /></div>
          {story.sources.length === 0 && <p>В демонстрационном материале источники отсутствуют.</p>}
          {story.sources.map((source, i) => <a href={source.url} target="_blank" rel="noreferrer" key={source.url}><em>{String(i + 1).padStart(2, "0")}</em><div><strong>{source.label}</strong><span>{new URL(source.url).hostname}</span></div><mark>{source.type === "PRIMARY" ? verification[story.verification] : source.type}</mark><b>↗</b></a>)}
          {story.xPosts.map(post => <a href={post.url} target="_blank" rel="noreferrer" key={post.url}><em>X</em><div><strong>{post.author}</strong><span>Проверенная публикация</span></div><mark>CONFIRMED</mark><b>↗</b></a>)}
        </section>
      </article>
    </div>
  </main>;
}
