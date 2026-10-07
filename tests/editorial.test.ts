import { afterEach, describe, expect, it, vi } from "vitest";
import { issueSchema } from "@/lib/editorial-schema";
import { isDuplicateError, verifyBearer } from "@/lib/security";
import { publishWithTransaction } from "@/lib/editorial-service";
import type { IssueWriter } from "@/lib/editorial-service";
import type { EditorialPayload } from "@/lib/editorial-schema";
import { POST } from "@/app/api/editorial/issues/route";
import { insertIssue } from "@/lib/db";

vi.mock("@/lib/db", () => ({ insertIssue: vi.fn() }));

const body="А".repeat(1000);
const valid={date:"2026-10-01",title:"Главный выпуск дня",summary:"Достаточно подробное описание сегодняшнего выпуска и его основных тем.",stories:[{rank:1,lead:true,category:"MODELS",title:"Новая модель решает практические задачи",slug:"new-model",dek:"Подробный вводный абзац, который объясняет значение новости для читателя.",excerpt:"Полезный фрагмент статьи с несколькими конкретными предложениями, важными фактами и достаточной длиной для карточки.",body,takeaway:"Если вы пользуетесь обычным чат-ботом, сегодня ничего не меняется. Разработчики могут проверить модель на безопасной тестовой задаче и оценить лимиты тарифа.",image:{url:"/signal-1.svg",alt:"Абстрактное изображение модели"},verification:"CONFIRMED",sources:[{label:"Официальная документация",url:"https://example.com/news",type:"PRIMARY"}],xPosts:[]}]};
describe("editorial payload",()=>{
  it("accepts a complete valid issue",()=>expect(issueSchema.safeParse(valid).success).toBe(true));
  it("rejects articles shorter than 1000 characters",()=>{const value=structuredClone(valid);value.stories[0].body="коротко";expect(issueSchema.safeParse(value).success).toBe(false)});
  it("rejects malformed source URLs",()=>{const value=structuredClone(valid);value.stories[0].sources[0].url="javascript:alert(1)";expect(issueSchema.safeParse(value).success).toBe(false)});
  it("rejects unverified and non-X posts",()=>{const value={...structuredClone(valid),stories:[{...structuredClone(valid.stories[0]),xPosts:[{author:"@signal",url:"https://example.com/post",verified:false}]}]};expect(issueSchema.safeParse(value).success).toBe(false)});
  it("rejects X status URLs that do not match the author",()=>{const value={...structuredClone(valid),stories:[{...structuredClone(valid.stories[0]),xPosts:[{author:"@signal",url:"https://x.com/other/status/123",verified:true}]}]};expect(issueSchema.safeParse(value).success).toBe(false)});
  it("requires a primary source",()=>{const value=structuredClone(valid);value.stories[0].sources[0].type="ANALYSIS";expect(issueSchema.safeParse(value).success).toBe(false)});
  it("rejects duplicate story slugs",()=>{const value=structuredClone(valid);value.stories.push({...value.stories[0],rank:2,lead:false});expect(issueSchema.safeParse(value).success).toBe(false)});
});
describe("editorial authentication",()=>{afterEach(()=>delete process.env.EDITORIAL_API_SECRET);it("requires a long matching bearer secret",()=>{process.env.EDITORIAL_API_SECRET="a-secure-editorial-secret-123";expect(verifyBearer("Bearer a-secure-editorial-secret-123")).toBe(true);expect(verifyBearer("Bearer wrong")).toBe(false);expect(verifyBearer(null)).toBe(false)})});
describe("database behavior",()=>{it("recognizes PostgreSQL uniqueness conflicts",()=>expect(isDuplicateError({code:"23505"})).toBe(true));it("executes writes inside transaction and propagates rollback",async()=>{const order:string[]=[];const writer:IssueWriter={transaction:async<T>(work:()=>Promise<T>)=>{order.push("begin");try{const result=await work();order.push("commit");return result}catch(e){order.push("rollback");throw e}},insertIssue:vi.fn(async()=>{order.push("insert");throw new Error("failure")})};await expect(publishWithTransaction(writer,valid as EditorialPayload)).rejects.toThrow("failure");expect(order).toEqual(["begin","insert","rollback"])})});

describe("editorial API route",()=>{
  const secret="a-secure-editorial-secret-123";
  afterEach(()=>{delete process.env.EDITORIAL_API_SECRET;vi.resetAllMocks()});
  const request=(token:string|null,body:unknown)=>new Request("http://localhost/api/editorial/issues",{method:"POST",headers:{...(token?{authorization:`Bearer ${token}`}:{})},body:JSON.stringify(body)});
  it("rejects anonymous writes before parsing data",async()=>{process.env.EDITORIAL_API_SECRET=secret;const response=await POST(request(null,valid));expect(response.status).toBe(401);expect(insertIssue).not.toHaveBeenCalled()});
  it("returns field errors for invalid articles",async()=>{process.env.EDITORIAL_API_SECRET=secret;const value=structuredClone(valid);value.stories[0].body="short";const response=await POST(request(secret,value));expect(response.status).toBe(422);expect((await response.json()).error.issues[0].path).toContain("stories")});
  it("returns 409 for duplicate issue dates",async()=>{process.env.EDITORIAL_API_SECRET=secret;vi.mocked(insertIssue).mockRejectedValueOnce({code:"23505"});const response=await POST(request(secret,valid));expect(response.status).toBe(409)});
  it("commits a valid issue and returns its count",async()=>{process.env.EDITORIAL_API_SECRET=secret;vi.mocked(insertIssue).mockResolvedValueOnce({id:"issue-id",date:valid.date,storyCount:1});const response=await POST(request(secret,valid));expect(response.status).toBe(201);expect((await response.json()).result.storyCount).toBe(1)});
});
