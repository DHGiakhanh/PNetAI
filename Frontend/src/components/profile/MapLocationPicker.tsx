import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Search, Compass, Loader2, Navigation } from 'lucide-react';
import axios from 'axios';

// Fix Leaflet default icon issues
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface LocationData {
  address: string;
  lat: number;
  lng: number;
}

interface MapLocationPickerProps {
  initialValue?: string;
  initialCoords?: [number, number]; // [lng, lat]
  onChange: (data: LocationData) => void;
}

const centerDefault: [number, number] = [10.762622, 106.660172]; // TP.HCM

// Component to handle map centering and movement
const MapController = ({ center }: { center: [number, number] }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({ initialValue, initialCoords, onChange }) => {
  const [pos, setPos] = useState<[number, number]>(
    initialCoords ? [initialCoords[1], initialCoords[0]] : centerDefault
  );
  const [address, setAddress] = useState(initialValue || "");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  // Sync with initial values
  useEffect(() => {
    if (initialCoords) setPos([initialCoords[1], initialCoords[0]]);
    if (initialValue) setAddress(initialValue);
  }, [initialCoords, initialValue]);

  // Reverse Geocoding: Get address from LatLng
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
      if (res.data) {
        const addr = res.data.display_name;
        setAddress(addr);
        setSearchQuery(addr);
        onChange({ address: addr, lat, lng });
      }
    } catch (err) {
      console.error("Geocoding error:", err);
    }
  };

  // Search address
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&countrycodes=vn&limit=5`);
      setSearchResults(res.data);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const selectSearchResult = (result: any) => {
    const newPos: [number, number] = [parseFloat(result.lat), parseFloat(result.lon)];
    setPos(newPos);
    setAddress(result.display_name);
    setSearchQuery(result.display_name);
    setSearchResults([]);
    onChange({ address: result.display_name, lat: newPos[0], lng: newPos[1] });
  };

  const handleLocateMe = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newPos: [number, number] = [position.coords.latitude, position.coords.longitude];
        setPos(newPos);
        reverseGeocode(newPos[0], newPos[1]);
        setIsLocating(false);
      },
      () => {
        setIsLocating(false);
        alert("Could not detect location.");
      }
    );
  };

  // Map Click Handler Component
  const MapEvents = () => {
    useMapEvents({
      click(e) {
        const newPos: [number, number] = [e.latlng.lat, e.latlng.lng];
        setPos(newPos);
        reverseGeocode(newPos[0], newPos[1]);
      },
    });
    return null;
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Search Input Bar */}
      <div className="relative group">
         <div className="flex gap-4">
            <div className="relative flex-1">
               <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
               <input 
                 type="text"
                 placeholder="Find your location in Vietnam..."
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                 className="w-full bg-white border border-gray-200 h-16 pl-14 pr-6 rounded-3xl outline-none font-bold text-sm focus:border-blue-400 focus:ring-4 focus:ring-blue-500/5 transition-all shadow-sm"
               />
               {isSearching && <Loader2 className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />}
            </div>
            <button 
              onClick={handleLocateMe}
              disabled={isLocating}
              className="h-16 px-6 bg-blue-50 text-blue-600 rounded-3xl border border-blue-100 flex items-center justify-center gap-2 hover:bg-blue-100 transition-all font-black text-[10px] uppercase tracking-widest"
            >
               {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Compass className="w-4 h-4" />}
               GPS
            </button>
         </div>

         {/* Search Results Dropdown */}
         {searchResults.length > 0 && (
           <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-100 rounded-3xl shadow-2xl z-[1000] overflow-hidden">
              {searchResults.map((res, i) => (
                <button 
                  key={i}
                  onClick={() => selectSearchResult(res)}
                  className="w-full p-5 text-left hover:bg-gray-50 border-b border-gray-50 flex items-start gap-4 transition-colors"
                >
                   <MapPin className="w-4 h-4 text-blue-500 mt-1 shrink-0" />
                   <span className="text-xs font-bold text-gray-700 leading-relaxed">{res.display_name}</span>
                </button>
              ))}
           </div>
         )}
      </div>

      {/* Map Container */}
      <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white ring-1 ring-gray-100 z-0">
        <MapContainer 
          center={pos} 
          zoom={15} 
          scrollWheelZoom={true} 
          style={{ height: '400px', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={pos} />
          <MapController center={pos} />
          <MapEvents />
        </MapContainer>

        {/* Selected Info Overlay */}
        <div className="absolute bottom-6 left-6 right-6 z-[400] pointer-events-none">
           <div className="bg-white/90 backdrop-blur-md p-5 rounded-2xl shadow-xl border border-white/20 flex items-center gap-4 pointer-events-auto">
              <div className="h-12 w-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/30">
                 <Navigation className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                 <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Selected Location</p>
                 <p className="text-xs font-black text-gray-900 truncate leading-tight">
                    {address || "Click on map to select..."}
                 </p>
              </div>
           </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pl-4">
         <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
         <p className="text-[10px] text-gray-400 font-bold italic">
           * Click directly on the map to pin-point your exact facility location.
         </p>
      </div>
    </div>
  );
};
