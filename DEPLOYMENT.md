# MTS Deployment Guide

## Vercel Deployment Instructions

### Prerequisites
- Vercel account
- GitHub repository with your MTS code
- Database (PostgreSQL recommended for production)
- Cloudinary account
- OpenCage API key

### Step 1: Prepare Environment Variables

Create a `.env.local` file with the following variables:

```env
# Database (Production)
DATABASE_URL="postgresql://username:password@host:5432/database"

# NextAuth Configuration
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your-secure-secret-here"

# Google OAuth
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Cloudinary Configuration
CLOUDINARY_URL="cloudinary://api_key:api_secret@cloud_name"
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="your-cloudinary-cloud-name"

# Geocoding Service
OPENCAGE_API_KEY="your-opencage-api-key"

# Application Configuration
APP_NAME="MTS"
APP_URL="https://your-app.vercel.app"
```

### Step 2: Database Setup

#### Option A: Vercel Postgres (Recommended)
1. Go to your Vercel dashboard
2. Navigate to Storage → Create Database → Postgres
3. Copy the connection string to `DATABASE_URL`

#### Option B: External Database
- Use services like Supabase, PlanetScale, or Railway
- Update `DATABASE_URL` with your connection string

### Step 3: Deploy to Vercel

#### Method 1: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables
vercel env add NEXTAUTH_URL
vercel env add NEXTAUTH_SECRET
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add CLOUDINARY_URL
vercel env add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
vercel env add OPENCAGE_API_KEY
vercel env add DATABASE_URL
```

#### Method 2: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. **Framework Preset**: Select "Next.js" (should auto-detect)
5. **Build Settings**: 
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)
   - Install Command: `npm install` (auto-detected)
6. Configure environment variables in the dashboard
7. Deploy

### Step 4: Configure Services

#### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `https://your-app.vercel.app/api/auth/callback/google`
4. Copy Client ID and Secret to environment variables

#### Cloudinary Setup
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Get your Cloud Name, API Key, and API Secret
3. Update environment variables

#### OpenCage Geocoding
1. Sign up at [opencagedata.com](https://opencagedata.com)
2. Get your API key
3. Add to environment variables

### Step 5: Database Migration

After deployment, run database migrations:

```bash
# Connect to your production database
npx prisma db push

# Seed the database
npm run db:seed
```

### Step 6: Verify Deployment

1. Visit your deployed URL
2. Test user registration/login
3. Test report submission
4. Test admin functionality
5. Verify file uploads work
6. Check GPS location functionality

## Production Checklist

### Security
- [ ] All environment variables are set
- [ ] Database is properly secured
- [ ] HTTPS is enabled (automatic with Vercel)
- [ ] File uploads are working securely
- [ ] Admin access is restricted

### Performance
- [ ] Images are optimized via Cloudinary
- [ ] Database queries are efficient
- [ ] File uploads have proper size limits
- [ ] GPS geocoding is working

### Functionality
- [ ] User authentication works
- [ ] Report submission works
- [ ] Admin panel is accessible
- [ ] File uploads work
- [ ] GPS location works
- [ ] Email notifications (if implemented)

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Check `DATABASE_URL` format
   - Ensure database is accessible from Vercel
   - Run `npx prisma db push` to sync schema

2. **Authentication Issues**
   - Verify `NEXTAUTH_URL` matches your domain
   - Check Google OAuth redirect URIs
   - Ensure `NEXTAUTH_SECRET` is set

3. **File Upload Issues**
   - Check Cloudinary configuration
   - Verify file size limits
   - Test with different file types

4. **GPS/Location Issues**
   - Verify OpenCage API key
   - Check geocoding API endpoint
   - Test with different coordinates

### Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `NEXTAUTH_URL` | Your app URL | Yes |
| `NEXTAUTH_SECRET` | Random secret for NextAuth | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes |
| `CLOUDINARY_URL` | Cloudinary connection string | Yes |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes |
| `OPENCAGE_API_KEY` | OpenCage geocoding API key | No |
| `APP_NAME` | Application name | No |
| `APP_URL` | Application URL | No |

## Support

If you encounter issues:
1. Check Vercel function logs
2. Verify all environment variables
3. Test database connectivity
4. Check external service configurations
