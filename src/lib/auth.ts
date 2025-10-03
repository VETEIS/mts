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
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        
        // Special handling for admin email
        if (session.user.email === 'vescoton0@gmail.com') {
          // Ensure admin role is set in database
          await prisma.user.update({
            where: { id: user.id },
            data: { role: 'ADMIN' }
          })
          session.user.role = 'ADMIN'
          session.user.isActive = true
        } else {
          // Get user role from database for other users
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true, isActive: true }
          })
          session.user.role = dbUser?.role || 'REPORTER'
          session.user.isActive = dbUser?.isActive || true
        }
      }
      return session
    },
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
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'database',
  },
  events: {
    async createUser({ user }) {
      // Set role based on email
      const role = user.email === 'vescoton0@gmail.com' ? 'ADMIN' : 'REPORTER'
      
      await prisma.user.update({
        where: { id: user.id },
        data: { role }
      })
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
