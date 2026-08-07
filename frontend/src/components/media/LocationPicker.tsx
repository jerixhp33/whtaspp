import { useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LocationPicker({ onShare }: { onShare: (lat: number, lng: number) => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleShare = () => {
    setLoading(true);
    setError(null);
    
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onShare(position.coords.latitude, position.coords.longitude);
        setLoading(false);
      },
      (err) => {
        setError(err.message || "Failed to get location");
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  };

  return (
    <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-center max-w-sm">
      <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <MapPin className="h-8 w-8 text-emerald-500" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-100 mb-2">Share Location</h3>
      <p className="text-zinc-400 text-sm mb-6">Send your current location to this chat.</p>
      
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      
      <Button 
        className="w-full bg-emerald-600 hover:bg-emerald-700"
        onClick={handleShare}
        disabled={loading}
      >
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
        {loading ? "Getting location..." : "Share Current Location"}
      </Button>
    </div>
  );
}
