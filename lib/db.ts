import postgres from "postgres";
import type { EditorialPayload } from "./editorial-schema";
import type { ArchiveEntry, Issue, Story } from "./types";
import { archiveIssues, currentIssue } from "./sample-data";

let client: ReturnType<typeof postgres> | undefined;
function sql() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL_NOT_CONFIGURED");
  return client ??= postgres(process.env.DATABASE_URL, { max: 5, idle_timeout: 20, connect_timeout: 10, ssl: "require" });
}

export async function insertIssue(payload: EditorialPayload) {
  const db = sql();
  return db.begin(async tx => {
    const [issue] = await tx`INSERT INTO issues (issue_date,title,summary) VALUES (${payload.date},${payload.title},${payload.summary}) RETURNING id,issue_date`;
    for (const item of payload.stories) {
      const publishedAt = item.publishedAt ?? `${payload.date}T12:00:00.000Z`;
      const [saved] = await tx`INSERT INTO stories (issue_id,slug,rank,is_lead,category,title,dek,excerpt,body,takeaway,image_url,image_alt,image_credit,published_at,read_time,verification_status)
        VALUES (${issue.id},${item.slug},${item.rank},${item.lead},${item.category},${item.title},${item.dek},${item.excerpt},${item.body},${item.takeaway},${item.image.url},${item.image.alt},${item.image.credit ?? null},${publishedAt},${item.readTime ?? Math.max(3,Math.ceil(item.body.length/1200))},${item.verification}) RETURNING id`;
      for (const source of item.sources) await tx`INSERT INTO sources (story_id,label,url,source_type,is_primary,published_at) VALUES (${saved.id},${source.label},${source.url},${source.type},${source.isPrimary ?? source.type === "PRIMARY"},${source.publishedAt ?? null})`;
      for (const post of item.xPosts) await tx`INSERT INTO x_posts (story_id,author_handle,url,verified,published_at) VALUES (${saved.id},${post.author},${post.url},${post.verified},${post.publishedAt ?? null})`;
    }
    return { id: issue.id as string, date: payload.date, storyCount: payload.stories.length };
  });
}

type Row = Record<string, unknown>;
function mapStory(row:Row):Story {
  return {
    id:String(row.id), rank:Number(row.rank), lead:Boolean(row.is_lead), category:row.category as Story["category"], title:String(row.title), slug:String(row.slug), dek:String(row.dek), excerpt:String(row.excerpt), body:String(row.body), takeaway:String(row.takeaway), image:{url:String(row.image_url),alt:String(row.image_alt),credit:row.image_credit?String(row.image_credit):undefined}, verification:row.verification_status as Story["verification"], publishedAt:new Date(String(row.published_at)).toISOString(), readTime:Number(row.read_time), sources:(row.sources as Story["sources"])??[], xPosts:(row.x_posts as Story["xPosts"])??[]
  };
}
function mapIssue(issue: Row, stories: Row[]): Issue {
  return { id:String(issue.id), date:formatDate(issue.issue_date), title:String(issue.title), summary:String(issue.summary), stories: stories.map(mapStory) };
}

function formatDate(value: unknown) {
  return value instanceof Date ? value.toISOString().slice(0,10) : String(value).slice(0,10);
}

async function loadIssue(where: "latest" | string): Promise<Issue | null> {
  if (!process.env.DATABASE_URL) return null;
  const db=sql(); const rows = where === "latest" ? await db`SELECT * FROM issues ORDER BY issue_date DESC LIMIT 1` : await db`SELECT * FROM issues WHERE issue_date=${where} LIMIT 1`;
  if (!rows[0]) return null;
  const stories = await db`SELECT s.*, COALESCE((SELECT json_agg(json_build_object('label',label,'url',url,'type',source_type,'isPrimary',is_primary,'publishedAt',published_at)) FROM sources WHERE story_id=s.id),'[]') sources, COALESCE((SELECT json_agg(json_build_object('author',author_handle,'url',url,'verified',verified,'publishedAt',published_at)) FROM x_posts WHERE story_id=s.id),'[]') x_posts FROM stories s WHERE issue_id=${rows[0].id} ORDER BY rank`;
  return mapIssue(rows[0] as Row, stories as unknown as Row[]);
}

function demoOnly() { return process.env.NODE_ENV === "development" && process.env.AUTH_BYPASS_LOCAL === "1" && !process.env.DATABASE_URL; }

export async function getLatestIssue(): Promise<Issue | null> {
  if (demoOnly()) return currentIssue;
  return loadIssue("latest");
}
export async function getIssue(date:string): Promise<Issue | null> {
  if (demoOnly()) return archiveIssues.find(i=>i.date===date) ?? null;
  return loadIssue(date);
}
export async function getStory(slug:string): Promise<Story | null> {
  if (demoOnly()) return archiveIssues.flatMap(i=>i.stories).find(s=>s.slug===slug) ?? null;
  if (!process.env.DATABASE_URL) return null;
  const db=sql();
  const rows=await db`SELECT s.*, COALESCE((SELECT json_agg(json_build_object('label',label,'url',url,'type',source_type,'isPrimary',is_primary,'publishedAt',published_at)) FROM sources WHERE story_id=s.id),'[]') sources, COALESCE((SELECT json_agg(json_build_object('author',author_handle,'url',url,'verified',verified,'publishedAt',published_at)) FROM x_posts WHERE story_id=s.id),'[]') x_posts FROM stories s WHERE s.slug=${slug} LIMIT 1`;
  if (!rows[0]) return null;
  return mapStory(rows[0] as Row);
}
export async function getArchive(page=1): Promise<{items:ArchiveEntry[];hasMore:boolean}> {
  if (demoOnly()) return {items:archiveIssues.map(issue=>({date:issue.date,title:issue.title,storyCount:issue.stories.length,categories:Array.from(new Set(issue.stories.map(s=>s.category))),leadTitle:issue.stories[0].title,leadImageUrl:issue.stories[0].image.url,demo:true})),hasMore:false};
  if (!process.env.DATABASE_URL) return {items:[],hasMore:false};
  const db=sql();
  const rows=await db`SELECT i.issue_date,i.title,COUNT(s.id)::int story_count,ARRAY_REMOVE(ARRAY_AGG(DISTINCT s.category::text),NULL) categories,MAX(CASE WHEN s.is_lead THEN s.title END) lead_title,MAX(CASE WHEN s.is_lead THEN s.image_url END) lead_image_url FROM issues i LEFT JOIN stories s ON s.issue_id=i.id GROUP BY i.id ORDER BY i.issue_date DESC LIMIT 61 OFFSET ${(page-1)*60}`;
  return {items:rows.slice(0,60).map(row=>({date:formatDate(row.issue_date),title:String(row.title),storyCount:Number(row.story_count),categories:row.categories as ArchiveEntry["categories"],leadTitle:String(row.lead_title),leadImageUrl:String(row.lead_image_url)})),hasMore:rows.length>60};
}

export async function searchStories(query:string) {
  if (demoOnly()) return archiveIssues.flatMap(i=>i.stories).filter(s=>[s.title,s.body,s.category,...s.sources.map(x=>x.label)].join(" ").toLowerCase().includes(query.toLowerCase())).slice(0,20).map(s=>({slug:s.slug,title:s.title,category:s.category}));
  if (!process.env.DATABASE_URL) return [];
  const db=sql(); const pattern=`%${query}%`;
  const rows=await db`SELECT DISTINCT s.slug,s.title,s.category FROM stories s LEFT JOIN sources so ON so.story_id=s.id WHERE s.title ILIKE ${pattern} OR s.body ILIKE ${pattern} OR s.category::text ILIKE ${pattern} OR so.label ILIKE ${pattern} OR so.url ILIKE ${pattern} ORDER BY s.title LIMIT 20`;
  return rows.map(row=>({slug:String(row.slug),title:String(row.title),category:row.category as Story["category"]}));
}
