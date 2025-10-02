import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  timestamp: number;
}

interface UseLocationReturn {
  location: LocationData | null;
  isLoading: boolean;
  error: string | null;
  isSupported: boolean;
  requestLocation: () => Promise<void>;
  clearLocation: () => void;
  getCurrentLocation: () => Promise<LocationData | null>;
}

// Helper function to calculate distance between two coordinates in kilometers
const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Helper function to update location in database
const updateLocationInDatabase = async (locationData: LocationData) => {
  try {
    const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
    const response = await fetch(`${API_BASE_URL}/api/user/location`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0]}`
      },
      body: JSON.stringify({
        lat: locationData.lat,
        lng: locationData.lng,
        accuracy: locationData.accuracy
      })
    });

    if (response.ok) {
      console.log('📍 Location updated in database');
    } else {
      console.warn('⚠️ Failed to update location in database');
    }
  } catch (error) {
    console.warn('⚠️ Database location update failed:', error);
  }
};

export const useLocation = (): UseLocationReturn => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported] = useState(() => 'geolocation' in navigator);
  const [watchId, setWatchId] = useState<number | null>(null);

  // Load saved location from localStorage and database on mount
  useEffect(() => {
    const loadSavedLocation = async () => {
      // First try localStorage
      const savedLocation = localStorage.getItem('userLocation');
      if (savedLocation) {
        try {
          const parsed = JSON.parse(savedLocation);
          // Check if location is less than 1 hour old
          if (Date.now() - parsed.timestamp < 3600000) {
            setLocation(parsed);
            return;
          } else {
            localStorage.removeItem('userLocation');
          }
        } catch (e) {
          localStorage.removeItem('userLocation');
        }
      }

      // If no valid localStorage location, try database
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
        const response = await fetch(`${API_BASE_URL}/api/user/location`, {
          headers: {
            'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0]}`
          }
        });

        if (response.ok) {
          const dbLocation = await response.json();
          // Check if database location is less than 24 hours old
          if (dbLocation.updatedAt && Date.now() - new Date(dbLocation.updatedAt).getTime() < 86400000) {
            const locationData = {
              lat: dbLocation.lat,
              lng: dbLocation.lng,
              accuracy: dbLocation.accuracy,
              timestamp: new Date(dbLocation.updatedAt).getTime()
            };
            setLocation(locationData);
            localStorage.setItem('userLocation', JSON.stringify(locationData));
            console.log('📍 Loaded location from database');
          }
        }
      } catch (error) {
        console.log('No saved location found');
      }
    };

    loadSavedLocation();
  }, []);

  const requestLocation = useCallback(async () => {
    if (!isSupported) {
      const errorMsg = 'Geolocation is not supported by this browser';
      setError(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000 // 1 minute for real-time updates
          }
        );
      });

      const locationData: LocationData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now()
      };

      setLocation(locationData);
      
      // Save to localStorage
      localStorage.setItem('userLocation', JSON.stringify(locationData));
      
      // Save to database
      try {
        const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
        const response = await fetch(`${API_BASE_URL}/api/user/location`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0]}`
          },
          body: JSON.stringify({
            lat: locationData.lat,
            lng: locationData.lng,
            accuracy: locationData.accuracy
          })
        });

        if (response.ok) {
          console.log('📍 Location saved to database');
        } else {
          console.warn('⚠️ Failed to save location to database');
        }
      } catch (dbError) {
        console.warn('⚠️ Database location save failed:', dbError);
      }
      
      console.log('📍 Location obtained:', locationData);
      toast.success('Location enabled for better recommendations!');

      // Start watching location for real-time updates
      if (isSupported && !watchId) {
        const id = navigator.geolocation.watchPosition(
          (position) => {
            const newLocationData: LocationData = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: Date.now()
            };

            // Check if location has changed significantly (more than 100 meters)
            if (location) {
              const distance = calculateDistance(
                location.lat, location.lng,
                newLocationData.lat, newLocationData.lng
              );
              
              if (distance > 0.1) { // 100 meters
                console.log(`📍 Location changed by ${(distance * 1000).toFixed(0)}m, updating...`);
                setLocation(newLocationData);
                localStorage.setItem('userLocation', JSON.stringify(newLocationData));
                
                // Update database
                updateLocationInDatabase(newLocationData);
              }
            }
          },
          (error) => {
            console.warn('Location watch error:', error);
          },
          {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 60000 // 1 minute
          }
        );
        setWatchId(id);
      }

    } catch (err: any) {
      let errorMessage = 'Failed to get location';
      
      switch (err.code) {
        case err.PERMISSION_DENIED:
          errorMessage = 'Location access denied. Please enable location permissions.';
          break;
        case err.POSITION_UNAVAILABLE:
          errorMessage = 'Location information unavailable.';
          break;
        case err.TIMEOUT:
          errorMessage = 'Location request timed out.';
          break;
        default:
          errorMessage = 'An unknown error occurred while getting location.';
      }

      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Location error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isSupported]);

  const clearLocation = useCallback(async () => {
    setLocation(null);
    setError(null);
    localStorage.removeItem('userLocation');
    
    // Stop watching location
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      console.log('📍 Stopped watching location');
    }
    
    // Clear from database
    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5001';
      const response = await fetch(`${API_BASE_URL}/api/user/location`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${document.cookie.split('token=')[1]?.split(';')[0]}`
        }
      });

      if (response.ok) {
        console.log('🗑️ Location cleared from database');
      } else {
        console.warn('⚠️ Failed to clear location from database');
      }
    } catch (dbError) {
      console.warn('⚠️ Database location clear failed:', dbError);
    }
    
    toast.success('Location cleared');
  }, [watchId]);

  // Function to get current real-time location (not cached)
  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    if (!isSupported) {
      return null;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0 // Force fresh location, no cache
          }
        );
      });

      const currentLocationData: LocationData = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: Date.now()
      };

      console.log('📍 Got fresh current location:', currentLocationData);
      return currentLocationData;
    } catch (error) {
      console.warn('⚠️ Failed to get current location:', error);
      return location; // Fallback to cached location
    }
  }, [isSupported, location]);

  return {
    location,
    isLoading,
    error,
    isSupported,
    requestLocation,
    clearLocation,
    getCurrentLocation
  };
};
