import NextAuth, { getServerSession, type NextAuthOptions } from "next-auth";
import type { Session } from "next-auth";
import type { User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { JWT } from "next-auth/jwt";

type AppRole = "admin" | "customer" | "delivery";
type AppUser = User & { id: string; phone: string; role: AppRole };
type AppJWT = JWT & { id?: string; role?: AppRole; phone?: string };
type AppSessionUser = NonNullable<Session["user"]> & { id?: string; role?: AppRole; phone?: string };

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.password?.startsWith("$2")) {
          return null;
        }

        let isValid = false;
        try {
          isValid = await bcrypt.compare(credentials.password, user.password);
        } catch {
          return null;
        }
        if (!isValid) {
          return null;
        }

        let role: AppRole = "customer";
        if (user.role === "ADMIN") role = "admin";
        else if (user.role === "DELIVERY") role = "delivery";

        const appUser: AppUser = {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role,
        };
        return appUser;
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: unknown | null }) {
      if (user) {
        const u = user as AppUser;
        const t = token as AppJWT;
        t.id = u.id;
        t.role = u.role;
        t.phone = u.phone;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        const sUser = session.user as AppSessionUser;
        const t = token as AppJWT;
        sUser.id = t.id ?? token.sub;
        sUser.role = t.role;
        sUser.phone = t.phone;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

export function auth() {
  return getServerSession(authOptions);
}

export default NextAuth(authOptions);
