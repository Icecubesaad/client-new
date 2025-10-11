'use client';

import { useState } from 'react';

interface LocationResult {
  lat: number;
  lng: number;
  accuracy: number;
  source: string;
  timestamp: number;
}

export default function LocationDebug() {
  const [result, setResult] = useState<LocationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState<any>(null);

  const testLocation = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    // Collect diagnostics
    const diag = {
      isSecureContext: window.isSecureContext,
      protocol: window.location.protocol,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      permissions: null as any,
      connection: (navigator as any).connection?.effectiveType || 'unknown'
    };

    // Check permissions
    try {
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        diag.permissions = permission.state;
      }
    } catch (e) {
      diag.permissions = 'unavailable';
    }

    setDiagnostics(diag);
    console.log('🔧 System diagnostics:', diag);

    try {
      // Check if geolocation is supported
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      console.log('🔍 Testing GPS location access (30s timeout)...');
      console.log('📍 Make sure you are near a window or outdoors for best GPS signal');
      
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            console.log('✅ GPS position received:', pos);
            console.log('📊 Accuracy:', pos.coords.accuracy, 'meters');
            console.log('🛰️ Altitude accuracy:', pos.coords.altitudeAccuracy);
            resolve(pos);
          },
          (err) => {
            console.error('❌ GPS error:', err);
            reject(err);
          },
          {
            enableHighAccuracy: true,
            timeout: 30000,        // 30 second timeout for GPS
            maximumAge: 0          // No cache - force fresh GPS reading
          }
        );
      });

      const locationData: LocationResult = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        source: position.coords.accuracy < 100 ? 'GPS' : 'Network/WiFi',
        timestamp: Date.now()
      };

      setResult(locationData);
      console.log('✅ Location test successful:', locationData);

    } catch (err: any) {
      let errorMessage = 'Unknown error';
      
      switch (err.code) {
        case err.PERMISSION_DENIED:
          errorMessage = 'Location access denied. Please enable location permissions.';
          break;
        case err.POSITION_UNAVAILABLE:
          errorMessage = 'Location information unavailable. GPS might be disabled.';
          break;
        case err.TIMEOUT:
          errorMessage = 'Location request timed out. Try again or move to better GPS area.';
          break;
        default:
          errorMessage = err.message || 'Failed to get location';
      }
      
      setError(errorMessage);
      console.error('❌ Location test failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <h3 className="font-bold mb-3">🔧 Location Debug Tool</h3>
      
      <button
        onClick={testLocation}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? '🔄 Testing...' : '📍 Test Location Access'}
      </button>

      {error && (
        <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded">
          <p className="text-red-700 font-medium">❌ Error:</p>
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded">
          <p className="text-green-700 font-medium">✅ Location Found:</p>
          <div className="text-sm text-green-600 space-y-1">
            <p><strong>Coordinates:</strong> {result.lat.toFixed(6)}, {result.lng.toFixed(6)}</p>
            <p><strong>Accuracy:</strong> ±{Math.round(result.accuracy)}m</p>
            <p><strong>Source:</strong> {result.source}</p>
            <p><strong>Quality:</strong> {
              result.accuracy < 20 ? '🟢 Excellent (GPS)' :
              result.accuracy < 100 ? '🟡 Good (GPS/WiFi)' :
              '🟠 Fair (Network/IP)'
            }</p>
          </div>
        </div>
      )}

      {diagnostics && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-blue-700 font-medium">🔧 System Diagnostics:</p>
          <div className="text-xs text-blue-600 space-y-1">
            <p><strong>Protocol:</strong> {diagnostics.protocol}</p>
            <p><strong>Secure Context:</strong> {diagnostics.isSecureContext ? '✅ Yes' : '❌ No'}</p>
            <p><strong>Platform:</strong> {diagnostics.platform}</p>
            <p><strong>Permissions:</strong> {diagnostics.permissions}</p>
            <p><strong>Connection:</strong> {diagnostics.connection}</p>
            <p><strong>Device Type:</strong> {
              /Mobile|Android|iPhone|iPad/.test(diagnostics.userAgent) ? '📱 Mobile' : '💻 Desktop'
            }</p>
          </div>
        </div>
      )}

      <div className="mt-3 text-xs text-gray-600">
        <p><strong>Expected for GPS:</strong> Accuracy &lt; 20m</p>
        <p><strong>Expected for WiFi:</strong> Accuracy 20-100m</p>
        <p><strong>IP Location:</strong> Accuracy &gt; 1000m (city-level)</p>
        <p><strong>Note:</strong> Desktop computers usually don't have GPS chips</p>
      </div>
    </div>
  );
}
