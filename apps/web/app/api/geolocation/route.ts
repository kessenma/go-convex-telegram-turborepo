import { NextRequest, NextResponse } from 'next/server';

// Helper function to get client IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfIp = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  } else if (realIp) {
    return realIp.trim();
  } else if (cfIp) {
    return cfIp.trim();
  }
  
  return 'unknown';
}

// Helper function to check if IP is local/private
function isLocalIP(ip: string): boolean {
  return ip === 'unknown' || ip === '127.0.0.1' || ip === '::1' || 
         ip.startsWith('192.168.') || ip.startsWith('10.') || 
         ip.startsWith('172.16.') || ip.startsWith('172.17.') || 
         ip.startsWith('172.18.') || ip.startsWith('172.19.') ||
         ip.startsWith('172.2') || ip.startsWith('172.3');
}

// Get location data from ip-api.com (free service)
async function getLocationFromIP(ip: string) {
  try {
    // Use comprehensive fields from ip-api.com
    const fields = 'status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,isp,org,as';
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=${fields}`);
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        country: data.country || 'Unknown',
        countryCode: data.countryCode || 'Unknown',
        region: data.regionName || 'Unknown',
        city: data.city || 'Unknown',
        zip: data.zip || 'Unknown',
        timezone: data.timezone || 'Unknown',
        coordinates: [data.lat || 0, data.lon || 0] as [number, number],
        isp: data.isp || 'Unknown',
        org: data.org || 'Unknown',
        as: data.as || 'Unknown'
      };
    } else {
      console.warn('ip-api.com returned error:', data.message);
    }
  } catch (error) {
    console.warn('ip-api.com lookup failed:', error);
  }
  
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIP(request);

    // Handle local/private IPs
    if (isLocalIP(ip)) {
      return NextResponse.json({
        ip: ip,
        country: 'Local',
        countryCode: 'LOCAL',
        region: 'Local Network',
        city: 'Localhost',
        zip: '00000',
        timezone: 'Local',
        coordinates: [0, 0],
        isp: 'Local Network',
        org: 'Local Network',
        as: 'Local Network'
      });
    }

    // Get location data from external service
    const locationData = await getLocationFromIP(ip);
    
    if (locationData) {
      return NextResponse.json({
        ip: ip,
        ...locationData
      });
    }

    // Fallback response
    return NextResponse.json({
      ip: ip,
      country: 'Unknown',
      countryCode: 'Unknown',
      region: 'Unknown',
      city: 'Unknown',
      zip: 'Unknown',
      timezone: 'Unknown',
      coordinates: [0, 0],
      isp: 'Unknown',
      org: 'Unknown',
      as: 'Unknown'
    });

  } catch (error) {
    console.error('Geolocation API error:', error);
    return NextResponse.json({
      ip: 'unknown',
      country: 'Unknown',
      region: 'Unknown',
      city: 'Unknown',
      timezone: 'Unknown',
      coordinates: [0, 0]
    }, { status: 500 });
  }
}