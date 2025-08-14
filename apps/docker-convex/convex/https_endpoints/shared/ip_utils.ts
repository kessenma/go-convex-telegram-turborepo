/*
 * IP ADDRESS UTILITIES
 * apps/docker-convex/convex/https-endpoints/shared/ip_utils.ts
 * =====================
 * 
 * Utilities for extracting and processing IP address information from HTTP requests.
 */

// Function to extract IP address from request headers
export const getClientIpFromRequest = (request: Request): string => {
  // Try to get IP from standard headers
  const forwardedFor = request.headers.get('X-Forwarded-For');
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, the first one is the client
    return forwardedFor.split(',')[0].trim();
  }
  
  // Try other common headers
  const realIp = request.headers.get('X-Real-IP');
  if (realIp) {
    return realIp.trim();
  }
  
  // Try CF-Connecting-IP for Cloudflare
  const cfIp = request.headers.get('CF-Connecting-IP');
  if (cfIp) {
    return cfIp.trim();
  }
  
  // Try X-Client-IP
  const clientIp = request.headers.get('X-Client-IP');
  if (clientIp) {
    return clientIp.trim();
  }
  
  // Fallback to a placeholder if no IP can be determined
  return 'unknown';
};

// Placeholder function - actual geolocation will be done in Node.js action
export const getLocationFromIp = (ip: string) => {
  // Skip geolocation for local/private IPs
  if (ip === 'unknown' || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return {
      country: 'Local',
      region: 'Local Network',
      city: 'Localhost',
      timezone: 'Local',
      ll: [0, 0] as [number, number]
    };
  }

  // Return placeholder data - will be replaced by Node.js action
  return {
    country: 'Unknown',
    region: 'Unknown', 
    city: 'Unknown',
    timezone: 'Unknown',
    ll: [0, 0] as [number, number]
  };
};

// Legacy function for backward compatibility
export const getCountryFromIp = (ip: string): string => {
  const location = getLocationFromIp(ip);
  return location.country;
};

// Combined function to get IP and full location info
export const getIpAndLocationInfo = (request: Request) => {
  const ip = getClientIpFromRequest(request);
  const location = getLocationFromIp(ip);
  
  return { 
    ip, 
    country: location.country,
    region: location.region,
    city: location.city,
    timezone: location.timezone,
    coordinates: location.ll
  };
};

// Legacy function for backward compatibility
export const getIpAndCountryInfo = (request: Request) => {
  const info = getIpAndLocationInfo(request);
  return { ip: info.ip, country: info.country };
};