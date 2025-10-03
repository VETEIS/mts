import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { env } from '@/lib/env'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const latitude = searchParams.get('lat')
    const longitude = searchParams.get('lng')

    if (!latitude || !longitude) {
      return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 })
    }

    const lat = parseFloat(latitude)
    const lng = parseFloat(longitude)

    if (isNaN(lat) || isNaN(lng)) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 })
    }

    // Check if OpenCage API key is configured
    if (!env.OPENCAGE_API_KEY) {
      return NextResponse.json({
        error: 'Geocoding service not configured',
        fallback: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
      }, { status: 503 })
    }

    try {
      // Use OpenCage API for reverse geocoding
      const response = await fetch(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${env.OPENCAGE_API_KEY}&limit=1&no_annotations=1`
      )

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.results && data.results.length > 0) {
        const result = data.results[0]
        return NextResponse.json({
          success: true,
          address: result.formatted,
          components: {
            road: result.components.road,
            suburb: result.components.suburb,
            city: result.components.city,
            state: result.components.state,
            country: result.components.country
          },
          coordinates: {
            latitude: result.geometry.lat,
            longitude: result.geometry.lng
          }
        })
      } else {
        return NextResponse.json({
          success: false,
          fallback: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
          message: 'No address found for these coordinates'
        })
      }
    } catch (apiError) {
      console.error('Geocoding API error:', apiError)
      return NextResponse.json({
        success: false,
        fallback: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        error: 'Geocoding service unavailable'
      })
    }
  } catch (error) {
    console.error('Geocoding error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
