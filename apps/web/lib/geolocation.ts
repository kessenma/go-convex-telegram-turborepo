export interface LocationData {
  ip: string;
  country: string;
  countryCode: string;
  region: string;
  city: string;
  zip: string;
  timezone: string;
  coordinates: [number, number];
  isp: string;
  org: string;
  as: string;
}

// Get location data using our server-side API route
export async function getLocationData(): Promise<LocationData> {
  try {
    const response = await fetch('/api/geolocation');
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.warn('Geolocation failed:', error);
  }
  
  return {
    ip: 'unknown',
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
  };
}

// Cache location data to avoid repeated API calls
let cachedLocationData: LocationData | null = null;
let locationPromise: Promise<LocationData> | null = null;

export async function getCachedLocationData(): Promise<LocationData> {
  if (cachedLocationData) {
    return cachedLocationData;
  }
  
  if (locationPromise) {
    return locationPromise;
  }
  
  locationPromise = getLocationData();
  cachedLocationData = await locationPromise;
  locationPromise = null;
  
  return cachedLocationData;
}