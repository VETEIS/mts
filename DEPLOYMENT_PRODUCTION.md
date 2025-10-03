# 🚀 MTS Production Deployment - URGENT FIXES

## **❌ CURRENT ISSUES:**
1. **Database Error**: Prisma trying to use SQLite in production
2. **Environment Variables**: Missing production database URL
3. **Google OAuth**: Redirect URI needs to be updated

## **🔧 IMMEDIATE FIXES NEEDED:**

### **1. Set Up Vercel Postgres Database:**
1. Go to your Vercel Dashboard
2. Navigate to **Storage** → **Create Database** → **Postgres**
3. Copy the connection string (looks like: `postgresql://...`)
4. Add it as `DATABASE_URL` environment variable

### **2. Required Environment Variables in Vercel:**
```env
# Database (CRITICAL - Get from Vercel Postgres)
DATABASE_URL=postgresql://username:password@host:port/database

# NextAuth (CRITICAL)
NEXTAUTH_URL=https://mts-pi.vercel.app
NEXTAUTH_SECRET=your-secret-here

# Google OAuth (CRITICAL)
GOOGLE_CLIENT_ID=870615881323-jbn027o3c6mk79cenvud49q30jgi1em8.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-secret

# Cloudinary (Already set)
CLOUDINARY_URL=cloudinary://949263385589385:OtiwJcctpCRno13tE2np2FeDbBg@dz8gzke6s
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dz8gzke6s

# Optional
OPENCAGE_API_KEY=dcdb6e21d57e47968426a21487438849
APP_NAME=MTS
APP_URL=https://mts-pi.vercel.app
```

### **3. Update Google OAuth Redirect URI:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Edit your OAuth 2.0 Client ID
4. Add authorized redirect URI: `https://mts-pi.vercel.app/api/auth/callback/google`

### **4. Deploy and Run Database Migration:**
After setting up the database, you'll need to run:
```bash
npx prisma db push
npm run db:seed
```

## **🎯 STEP-BY-STEP DEPLOYMENT:**

1. **Create Vercel Postgres Database** (5 minutes)
2. **Set Environment Variables** in Vercel Dashboard (2 minutes)
3. **Update Google OAuth** redirect URI (2 minutes)
4. **Redeploy** your app (automatic)
5. **Run database migration** (1 minute)

## **✅ EXPECTED RESULT:**
- ✅ No more database errors
- ✅ Google OAuth working
- ✅ User authentication working
- ✅ MTS app fully functional

## **🚨 URGENT:**
The app is currently failing because it's trying to use SQLite in production. You MUST set up PostgreSQL database in Vercel!
