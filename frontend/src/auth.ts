import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { JWT } from "next-auth/jwt";
import { loginSchema } from "@/lib/validations";
import { loginWithBackend, type UserRole } from "@/lib/backend-auth";

class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid-credentials";
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      role: UserRole;
      name?: string | null;
      image?: string | null;
    };
    accessToken?: string;
  }

  interface User {
    id: string;
    email: string;
    role: UserRole;
    name?: string | null;
    image?: string | null;
    token?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: UserRole;
    accessToken?: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const result = await loginWithBackend(
          parsed.data.email,
          parsed.data.password
        );

        if (!result.ok) {
          throw new InvalidCredentialsError();
        }

        return {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          name: result.user.name,
          image: result.user.image,
          token: result.token,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.picture = user.image;
        token.accessToken = user.token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.name = token.name as string | null;
        session.user.image = token.picture as string | null;
      }
      session.accessToken = token.accessToken as string;
      return session;
    },
  },
});
