import { Role } from '@prisma/client'
import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: Role
      isActive: boolean
    }
  }

  interface User {
    role: Role
    isActive: boolean
  }
}
