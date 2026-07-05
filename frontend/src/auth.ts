import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { loginSchema } from "@/lib/validations";

class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid-credentials";
}

type Role = "STUDENT" | "ALUMNI" | "ADMIN";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: Role;
      name?: string | null;
      image?: string | null;
    };
    accessToken?: string;
  }

  interface User {
    id: string;
    email: string;
    role: Role;
    name?: string | null;
    image?: string | null;
    token?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const apiURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

        const res = await fetch(`${apiURL}/api/auth/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: parsed.data.email,
            password: parsed.data.password,
          }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new InvalidCredentialsError();
        }

        if (data.success && data.user) {
          return {
            id: data.user.id,
            email: data.user.email,
            role: data.user.role,
            name: data.user.name,
            image: data.user.image,
            token: data.token,
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.image = user.image;
        token.accessToken = user.token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.name = token.name as string | null;
        session.user.image = token.image as string | null;
      }
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
});
