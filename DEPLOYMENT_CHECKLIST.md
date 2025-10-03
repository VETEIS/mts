# 🚀 MTS Vercel Deployment Checklist

## Pre-Deployment Setup

### 1. Database Setup
- [ ] **Vercel Postgres** (Recommended)
  - Go to Vercel Dashboard → Storage → Create Database → Postgres
  - Copy connection string to `DATABASE_URL`
- [ ] **Alternative**: Supabase, PlanetScale, or Railway
  - Create PostgreSQL database
  - Copy connection string

### 2. External Services
- [ ] **Google OAuth**
  - Create project in Google Cloud Console
  - Enable Google+ API
  - Generate OAuth 2.0 credentials
  - Add redirect URI: `https://your-app.vercel.app/api/auth/callback/google`

- [ ] **Cloudinary**
  - Sign up at cloudinary.com
  - Get Cloud Name, API Key, API Secret
  - Test file upload functionality

- [ ] **OpenCage Geocoding** (Optional)
  - Sign up at opencagedata.com
  - Get API key for address geocoding

### 3. Environment Variables
Set these in Vercel dashboard:

```env
# Database
DATABASE_URL=postgresql://...

# NextAuth
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=your-secure-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Cloudinary
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name

# Optional
OPENCAGE_API_KEY=your-opencage-key
APP_NAME=MTS
APP_URL=https://your-app.vercel.app
```

## Deployment Methods

### Method 1: Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Set environment variables
vercel env add DATABASE_URL
vercel env add NEXTAUTH_URL
vercel env add NEXTAUTH_SECRET
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET
vercel env add CLOUDINARY_URL
vercel env add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
vercel env add OPENCAGE_API_KEY
```

### Method 2: Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import GitHub repository
4. **Framework Preset**: Select "Next.js" (auto-detected)
5. **Build Settings** (should auto-populate):
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`
6. Configure environment variables
7. Deploy

### Method 3: GitHub Integration
1. Connect GitHub repository to Vercel
2. Enable automatic deployments
3. Set environment variables
4. Push to main branch triggers deployment

## Post-Deployment Setup

### 1. Database Migration
```bash
# Connect to production database
npx prisma db push

# Seed the database
npm run db:seed
```

### 2. Test Core Functionality
- [ ] **Authentication**
  - [ ] Google OAuth login works
  - [ ] User registration works
  - [ ] Role-based redirects work

- [ ] **Report System**
  - [ ] Report submission works
  - [ ] GPS location capture works
  - [ ] File upload works
  - [ ] Report codes are generated

- [ ] **Admin Panel**
  - [ ] Admin dashboard loads
  - [ ] User management works
  - [ ] Report moderation works

- [ ] **File Uploads**
  - [ ] Photo capture works
  - [ ] Video recording works
  - [ ] Cloudinary integration works

### 3. Security Verification
- [ ] **HTTPS enabled** (automatic with Vercel)
- [ ] **Environment variables secured**
- [ ] **File uploads restricted to camera only**
- [ ] **Admin access properly restricted**
- [ ] **Database connections secure**

### 4. Performance Testing
- [ ] **Page load times acceptable**
- [ ] **File uploads work efficiently**
- [ ] **Database queries perform well**
- [ ] **Images optimized via Cloudinary**

## Troubleshooting

### Common Issues

#### Database Connection
```bash
# Check database connection
npx prisma db push

# If connection fails, verify DATABASE_URL format
# Should be: postgresql://username:password@host:port/database
```

#### Authentication Issues
- Verify `NEXTAUTH_URL` matches your domain exactly
- Check Google OAuth redirect URIs
- Ensure `NEXTAUTH_SECRET` is set and secure

#### File Upload Issues
- Verify Cloudinary configuration
- Check file size limits (25MB images, 50MB videos)
- Test with different file types

#### GPS/Location Issues
- Check OpenCage API key
- Verify geocoding API endpoint
- Test with different coordinates

### Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `DATABASE_URL` | PostgreSQL connection | Yes | `postgresql://user:pass@host:5432/db` |
| `NEXTAUTH_URL` | App URL | Yes | `https://your-app.vercel.app` |
| `NEXTAUTH_SECRET` | NextAuth secret | Yes | `random-secret-string` |
| `GOOGLE_CLIENT_ID` | Google OAuth ID | Yes | `123456789.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | Yes | `GOCSPX-...` |
| `CLOUDINARY_URL` | Cloudinary connection | Yes | `cloudinary://key:secret@cloud` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | Yes | `your-cloud-name` |
| `OPENCAGE_API_KEY` | Geocoding API key | No | `your-opencage-key` |

## Production Monitoring

### Vercel Analytics
- Enable Vercel Analytics for performance monitoring
- Monitor Core Web Vitals
- Track user engagement

### Error Monitoring
- Set up error tracking (Sentry recommended)
- Monitor API errors
- Track user feedback

### Database Monitoring
- Monitor database performance
- Set up alerts for high usage
- Regular backup verification

## Maintenance

### Regular Tasks
- [ ] Monitor error logs
- [ ] Check database performance
- [ ] Update dependencies
- [ ] Review security settings
- [ ] Backup database

### Scaling Considerations
- Database connection pooling
- CDN for static assets
- Image optimization
- Caching strategies

## Support

If you encounter issues:
1. Check Vercel function logs
2. Verify all environment variables
3. Test database connectivity
4. Check external service configurations
5. Review the deployment guide

## Success Criteria

Your deployment is successful when:
- ✅ Users can register and login
- ✅ Reports can be submitted with media
- ✅ Admin panel is accessible
- ✅ File uploads work securely
- ✅ GPS location works
- ✅ All features function as expected
