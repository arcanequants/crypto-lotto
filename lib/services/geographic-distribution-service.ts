// GEOGRAPHIC DISTRIBUTION SERVICE
// Track user distribution across countries/regions
// Powers the Geographic Distribution section in dashboard

import { createClient } from '@supabase/supabase-js'

// Helper to get Supabase client
function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase configuration')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

// ============================================
// TYPES
// ============================================
export interface RegionData {
  region: string
  country_code: string
  users: number
  percentage: number
}

export interface GeographicDistribution {
  total_users: number
  regions: {
    north_america: number
    europe: number
    asia: number
    latin_america: number
    africa: number
    oceania: number
  }
  top_countries: Array<{
    country: string
    country_code: string
    users: number
    percentage: number
  }>
  has_live_map: boolean
  timestamp: string
}

// ============================================
// REGION MAPPING
// ============================================

// Map country codes to regions
function getRegion(countryCode: string): string {
  const regionMap: Record<string, string> = {
    // North America
    US: 'north_america',
    CA: 'north_america',
    MX: 'north_america',

    // Europe
    GB: 'europe',
    DE: 'europe',
    FR: 'europe',
    IT: 'europe',
    ES: 'europe',
    NL: 'europe',
    BE: 'europe',
    CH: 'europe',
    AT: 'europe',
    SE: 'europe',
    NO: 'europe',
    DK: 'europe',
    FI: 'europe',
    PL: 'europe',
    CZ: 'europe',
    PT: 'europe',
    GR: 'europe',
    IE: 'europe',

    // Asia
    CN: 'asia',
    JP: 'asia',
    KR: 'asia',
    IN: 'asia',
    SG: 'asia',
    HK: 'asia',
    TW: 'asia',
    TH: 'asia',
    VN: 'asia',
    MY: 'asia',
    ID: 'asia',
    PH: 'asia',

    // Latin America
    BR: 'latin_america',
    AR: 'latin_america',
    CL: 'latin_america',
    CO: 'latin_america',
    PE: 'latin_america',
    VE: 'latin_america',
    EC: 'latin_america',
    BO: 'latin_america',
    UY: 'latin_america',
    PY: 'latin_america',

    // Africa
    ZA: 'africa',
    NG: 'africa',
    EG: 'africa',
    KE: 'africa',
    MA: 'africa',
    GH: 'africa',

    // Oceania
    AU: 'oceania',
    NZ: 'oceania',
  }

  return regionMap[countryCode] || 'other'
}

// ============================================
// DATA COLLECTION
// ============================================

/**
 * Get geographic distribution of users
 */
export async function getGeographicDistribution(): Promise<GeographicDistribution> {
  const supabase = getSupabaseClient()

  try {
    // Get all user geolocations
    const { data: geolocations, error } = await supabase
      .from('user_geolocations')
      .select('country, country_code')

    if (error) {
      console.error('Error fetching geolocations:', error)
      throw error
    }

    // If no geolocation data, return default structure
    if (!geolocations || geolocations.length === 0) {
      return {
        total_users: 0,
        regions: {
          north_america: 0,
          europe: 0,
          asia: 0,
          latin_america: 0,
          africa: 0,
          oceania: 0,
        },
        top_countries: [],
        has_live_map: false,
        timestamp: new Date().toISOString(),
      }
    }

    // Count users by region
    const regionCounts: Record<string, number> = {
      north_america: 0,
      europe: 0,
      asia: 0,
      latin_america: 0,
      africa: 0,
      oceania: 0,
      other: 0,
    }

    // Count users by country
    const countryCounts: Record<string, { country: string; country_code: string; users: number }> = {}

    geolocations.forEach((geo) => {
      if (!geo.country_code) return

      // Update region count
      const region = getRegion(geo.country_code)
      regionCounts[region] = (regionCounts[region] || 0) + 1

      // Update country count
      if (!countryCounts[geo.country_code]) {
        countryCounts[geo.country_code] = {
          country: geo.country || geo.country_code,
          country_code: geo.country_code,
          users: 0,
        }
      }
      countryCounts[geo.country_code].users++
    })

    // Get top 10 countries
    const topCountries = Object.values(countryCounts)
      .sort((a, b) => b.users - a.users)
      .slice(0, 10)
      .map((country) => ({
        ...country,
        percentage: Math.round((country.users / geolocations.length) * 100),
      }))

    const totalUsers = geolocations.length

    return {
      total_users: totalUsers,
      regions: {
        north_america: regionCounts.north_america || 0,
        europe: regionCounts.europe || 0,
        asia: regionCounts.asia || 0,
        latin_america: regionCounts.latin_america || 0,
        africa: regionCounts.africa || 0,
        oceania: regionCounts.oceania || 0,
      },
      top_countries: topCountries,
      has_live_map: totalUsers > 0,
      timestamp: new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error in getGeographicDistribution:', error)
    throw error
  }
}

/**
 * Get user count by region
 */
export async function getUsersByRegion(region: string): Promise<number> {
  const distribution = await getGeographicDistribution()
  const regionKey = region.toLowerCase().replace(' ', '_') as keyof typeof distribution.regions
  return distribution.regions[regionKey] || 0
}

/**
 * Add or update user geolocation
 * This should be called when a user signs up or logs in
 */
export async function updateUserGeolocation(
  userId: string,
  geolocationData: {
    country?: string
    country_code?: string
    region?: string
    city?: string
    latitude?: number
    longitude?: number
    timezone?: string
    ip_address?: string
  }
): Promise<boolean> {
  const supabase = getSupabaseClient()

  try {
    const { error } = await supabase
      .from('user_geolocations')
      .upsert({
        user_id: userId,
        ...geolocationData,
        updated_at: new Date().toISOString(),
      })

    if (error) {
      console.error('Error updating user geolocation:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error in updateUserGeolocation:', error)
    return false
  }
}

/**
 * Get geolocation from IP address
 * This is a helper function that can be used to get geo data from IP
 * You can integrate with services like ipapi.co, ip-api.com, etc.
 */
export async function getGeolocationFromIP(ipAddress: string): Promise<{
  country?: string
  country_code?: string
  region?: string
  city?: string
  latitude?: number
  longitude?: number
  timezone?: string
} | null> {
  try {
    // Using ipapi.co (free tier: 1000 requests/day)
    const response = await fetch(`https://ipapi.co/${ipAddress}/json/`)

    if (!response.ok) {
      return null
    }

    const data = await response.json()

    return {
      country: data.country_name,
      country_code: data.country_code,
      region: data.region,
      city: data.city,
      latitude: data.latitude,
      longitude: data.longitude,
      timezone: data.timezone,
    }
  } catch (error) {
    console.error('Error fetching geolocation from IP:', error)
    return null
  }
}
