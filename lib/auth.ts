import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password required")
        }
        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })
        if (!user || !user.password) {
          throw new Error("No account found with this email")
        }
        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) throw new Error("Incorrect password")
        return user
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.email = user.email
        // Get user's workspaces
        const member = await prisma.workspaceMember.findFirst({
          where: { userId: user.id },
          include: { workspace: true },
          orderBy: { joinedAt: "asc" },
        })
        if (member) {
          token.workspaceId = member.workspaceId
          token.workspaceSlug = member.workspace.slug
          token.role = member.role
        }
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.workspaceId = token.workspaceId as string
        session.user.workspaceSlug = token.workspaceSlug as string
        session.user.role = token.role as string
      }
      return session
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        // Auto-create workspace for new Google users
        const existing = await prisma.workspaceMember.findFirst({
          where: { userId: user.id },
        })
        if (!existing) {
          const slug = user.email!.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "-")
          const workspace = await prisma.workspace.create({
            data: {
              name: `${user.name || user.email}'s Workspace`,
              slug: `${slug}-${Date.now()}`,
              members: {
                create: { userId: user.id, role: "ADMIN" },
              },
              notifSettings: { create: {} },
            },
          })
        }
      }
      return true
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
}

// Extend NextAuth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      workspaceId: string
      workspaceSlug: string
      role: string
    }
  }
}
