import { describe, expect, it } from "vitest";
import { parseFeed } from "@/lib/ai-editor";

describe("official feed parser", () => {
  it("parses RSS and strips embedded markup", () => {
    const items = parseFeed(
      `<rss><channel><item><title><![CDATA[Новая модель &amp; API]]></title><link>https://example.com/news</link><pubDate>Mon, 12 Oct 2026 08:00:00 GMT</pubDate><description><![CDATA[<p>Факты <strong>без разметки</strong>.</p>]]></description></item></channel></rss>`,
      "Official",
    );
    expect(items).toEqual([{ feed: "Official", title: "Новая модель & API", url: "https://example.com/news", publishedAt: "2026-10-12T08:00:00.000Z", summary: "Факты без разметки ." }]);
  });

  it("parses Atom links and rejects non-HTTPS URLs", () => {
    const xml = `<feed><entry><title>Valid item</title><link href="https://example.com/atom"/><published>2026-10-12T09:00:00Z</published><summary>Useful source text</summary></entry><entry><title>Bad item</title><link href="http://example.com/bad"/><published>2026-10-12T09:00:00Z</published><summary>Ignored text</summary></entry></feed>`;
    expect(parseFeed(xml, "Atom").map(item => item.url)).toEqual(["https://example.com/atom"]);
  });
});
