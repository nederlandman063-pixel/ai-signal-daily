import { NextResponse } from "next/server";
import { getStoredIssue } from "@/lib/db";
import { verifyBearer } from "@/lib/security";

export async function GET(request:Request,{params}:{params:Promise<{date:string}>}) {
  if(!verifyBearer(request.headers.get("authorization"))) return NextResponse.json({ok:false,error:{code:"UNAUTHORIZED",message:"Требуется действительный Bearer token"}},{status:401});
  const {date}=await params; if(!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ok:false,error:{code:"INVALID_DATE",message:"Ожидается YYYY-MM-DD"}},{status:400});
  const issue=await getStoredIssue(date); return issue ? NextResponse.json({ok:true,result:issue}) : NextResponse.json({ok:false,error:{code:"NOT_FOUND",message:"Выпуск не найден"}},{status:404});
}
