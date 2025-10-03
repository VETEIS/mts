import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@next-auth/prisma-adapter'
import { prisma } from './prisma'
import { env, validateEnv, debugEnv } from './env'

// Debug environment on startup
debugEnv()
validateEnv()

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      try {
        console.log('🔐 Sign in attempt for:', user.email)
        
        // Check if user is active
        if (user.email) {
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { isActive: true }
          })
          
          if (existingUser && !existingUser.isActive) {
            console.log('❌ Sign in blocked for inactive user:', user.email)
            return false // Prevent sign in for inactive users
          }
        }
        
        console.log('✅ Sign in allowed for user:', user.email)
        return true
      } catch (error) {
        console.error('❌ Sign in error:', error)
        return false
      }
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        
        // Get role and status from database (allows admin to promote users)
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true, isActive: true }
        })
        
        // SECURITY: Only vescoton0@gmail.com gets ADMIN by default
        // Other users get role from database (allows admin to promote them)
        const role = dbUser?.role || (user.email === 'vescoton0@gmail.com' ? 'ADMIN' : 'REPORTER')
        const isActive = dbUser?.isActive ?? true
        
        token.role = role
        token.isActive = isActive
        
        console.log('🔐 JWT Token assigned:', {
          email: user.email,
          role: role,
          isActive: isActive,
          fromDatabase: !!dbUser,
          userId: user.id,
          dbUserRole: dbUser?.role
        })
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.isActive = token.isActive as boolean
        
        console.log('🔐 Session created:', {
          email: session.user.email,
          role: session.user.role,
          userId: session.user.id,
          tokenRole: token.role
        })
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  events: {
    async createUser({ user }) {
      // Role is assigned in JWT callback, not in database
      console.log('✅ New user created:', user.email, 'Role will be assigned via JWT')
    },
    async signIn({ user }) {
      // Ensure vescoton0@gmail.com is always admin
      if (user.email === 'vescoton0@gmail.com') {
        await prisma.user.update({
          where: { email: user.email },
          data: { role: 'ADMIN' }
        })
      }
      // Don't return anything - NextAuth expects void
    },
  },
}
