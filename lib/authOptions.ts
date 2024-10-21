import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import prisma from "./prisma";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { NextResponse } from "next/server";



declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }
  }
}



export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }
      
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });
      
        if (!user || !user.password) {
          throw new Error("No user found");
        }
      
        const isPasswordValid = await compare(credentials.password, user.password);
      
        if (!isPasswordValid) {
          throw new Error("Invalid password");
        }
      
        return {
          id: user.id.toString(),
          email: user.email,
          name: user.name,
        };
      }
      
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  pages: {
    signIn: '/auth/signin',
  },
  session: {
    strategy: "jwt",
  },
};

export default NextAuth(authOptions);
