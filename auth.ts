import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 12 },
  providers: [Credentials({
    credentials: { email: { type: "email" }, password: { type: "password" } },
    async authorize(raw) {
      const parsed = z.object({ email:z.email(), password:z.string().min(12).max(200) }).safeParse(raw);
      const email=process.env.ADMIN_EMAIL; const hash=process.env.ADMIN_PASSWORD_HASH;
      if (!parsed.success || !email || !hash || parsed.data.email.toLowerCase()!==email.toLowerCase()) return null;
      if (!(await bcrypt.compare(parsed.data.password, hash))) return null;
      return { id:"owner", email, name:"Владелец" };
    },
  })],
  callbacks: {
    authorized({ auth: session, request }) {
      const path=request.nextUrl.pathname;
      if (path.startsWith("/api/editorial") || path.startsWith("/api/auth") || path==="/login" || path==="/robots.txt") return true;
      if (process.env.NODE_ENV === "development" && process.env.AUTH_BYPASS_LOCAL === "1") return true;
      return Boolean(session?.user);
    },
  },
});
