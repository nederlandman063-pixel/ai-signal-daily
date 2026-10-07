import { AuthError } from "next-auth";
import { signIn } from "@/auth";
import { redirect } from "next/navigation";

export default async function LoginPage({searchParams}:{searchParams:Promise<{error?:string}>}) {
  const failed=(await searchParams).error==="credentials";
  async function login(formData:FormData) { "use server"; try { await signIn("credentials",formData); } catch(error) { if(error instanceof AuthError) redirect("/login?error=credentials"); throw error; } }
  return <main className="login-shell"><section className="login-card"><div className="eyebrow"><i/>PRIVATE SIGNAL</div><h1>Вход в<br/>редакцию</h1><p>Закрытый ежедневный обзор искусственного интеллекта.</p><form action={login}><input type="hidden" name="redirectTo" value="/"/><label>Почта<input name="email" type="email" autoComplete="email" required/></label><label>Пароль<input name="password" type="password" autoComplete="current-password" minLength={12} required/></label>{failed&&<p role="alert" className="login-error">Неверная почта или пароль.</p>}<button className="solid-button">ВОЙТИ <span>↗</span></button></form><small>Регистрация отключена. Доступ выдаёт владелец.</small></section></main>;
}
