import { NextResponse } from "next/server";
import { issueSchema } from "@/lib/editorial-schema";
import { insertIssue } from "@/lib/db";
import { isDuplicateError, verifyBearer } from "@/lib/security";

export async function POST(request: Request) {
  if (!verifyBearer(request.headers.get("authorization"))) return NextResponse.json({ ok:false, error:{code:"UNAUTHORIZED",message:"Требуется действительный Bearer token"} },{status:401,headers:{"WWW-Authenticate":"Bearer"}});
  let json: unknown; try { json=await request.json(); } catch { return NextResponse.json({ok:false,error:{code:"INVALID_JSON",message:"Тело запроса не является JSON"}},{status:400}); }
  const parsed=issueSchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ok:false,error:{code:"VALIDATION_ERROR",message:"Выпуск не прошёл проверку",issues:parsed.error.issues.map(i=>({path:i.path.join("."),message:i.message}))}},{status:422});
  try { const result=await insertIssue(parsed.data); return NextResponse.json({ok:true,result},{status:201}); }
  catch(error) { if(isDuplicateError(error)) return NextResponse.json({ok:false,error:{code:"DUPLICATE",message:"Дата выпуска или slug статьи уже существует"}},{status:409}); console.error("Editorial insert failed", error instanceof Error ? error.message : "unknown"); return NextResponse.json({ok:false,error:{code:"DATABASE_ERROR",message:"Не удалось сохранить выпуск"}},{status:500}); }
}
