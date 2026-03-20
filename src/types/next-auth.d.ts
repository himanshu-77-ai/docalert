import { DefaultSession } from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      image?: string
    } & DefaultSession['user']
    workspace?: {
      id: string
      name: string
      slug: string
      plan: string
      role: string
    }
  }
}
