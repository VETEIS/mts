#!/bin/bash

# MTS Vercel Deployment Script
echo "🚀 Starting MTS deployment to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if user is logged in
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please login to Vercel..."
    vercel login
fi

# Deploy to Vercel
echo "📦 Deploying to Vercel..."
vercel --prod

# Set environment variables (you'll need to do this manually)
echo "⚠️  Don't forget to set these environment variables in Vercel dashboard:"
echo "   - DATABASE_URL"
echo "   - NEXTAUTH_URL"
echo "   - NEXTAUTH_SECRET"
echo "   - GOOGLE_CLIENT_ID"
echo "   - GOOGLE_CLIENT_SECRET"
echo "   - CLOUDINARY_URL"
echo "   - NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"
echo "   - OPENCAGE_API_KEY"

echo "✅ Deployment complete! Check your Vercel dashboard for the URL."
