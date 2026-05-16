import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
  X, 
  MapPin, 
  Phone, 
  ChevronRight, 
  Maximize2,
  LocateFixed
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Fix Leaflet icons


const UserIcon = L.divIcon({
  className: 'user-location-marker',
  html: `<div class="relative">
    <div class="absolute -inset-2 bg-blue-500/30 rounded-full animate-ping"></div>
    <div class="relative w-4 h-4 bg-blue-600 border-2 border-white rounded-full shadow-lg"></div>
  </div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const AtelierIcon = L.divIcon({
  className: 'atelier-marker',
  html: `<div class="w-10 h-10 bg-caramel text-white rounded-2xl flex items-center justify-center shadow-xl border-2 border-white transform -translate-y-2 hover:scale-110 transition-transform">
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M3 7v1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7m0 1a3 3 0 0 0 6 0V7H3l2-4h14l2 4"/><path d="M5 21V10.85"/><path d="M19 21V10.85"/><path d="M9 21v-4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v4"/></svg>
  </div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 40]
});

interface Facility {
  _id: string;
  providerUserId: string;
  providerName: string;
  providerAddress: string;
  providerDescription: string;
  providerAvatarUrl: string;
  providerLocation?: {
    coordinates: [number, number]; // [lng, lat]
  };
  categories: string[];
}

interface ServicesMapOverlayProps {
  facilities: Facility[];
  userLocation: { lat: number; lng: number } | null;
  onClose: () => void;
}

// Component to control map view (center/zoom)
const ChangeView = ({ center, zoom }: { center: [number, number], zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 1 });
  }, [center, zoom, map]);
  return null;
};

export const ServicesMapOverlay: React.FC<ServicesMapOverlayProps> = ({ facilities, userLocation, onClose }) => {
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(
    userLocation ? [userLocation.lat, userLocation.lng] : [10.762622, 106.660172]
  );
  const [mapZoom, setMapZoom] = useState(13);

  const handleSelectFacility = (f: Facility) => {
    setSelectedFacility(f);
    if (f.providerLocation?.coordinates) {
      setMapCenter([f.providerLocation.coordinates[1], f.providerLocation.coordinates[0]]);
      setMapZoom(16);
    }
  };

  const handleGoToUser = () => {
    if (userLocation) {
      setMapCenter([userLocation.lat, userLocation.lng]);
      setMapZoom(15);
      setSelectedFacility(null); // Clear selection when returning to user
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] bg-white flex flex-col md:flex-row overflow-hidden font-sans"
    >
      {/* Mobile Header / Close */}
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 z-[10001] h-12 w-12 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl border border-sand hover:bg-rose-50 hover:text-rose-600 transition-all"
      >
        <X className="w-6 h-6" />
      </button>

      {/* Sidebar - Facility List */}
      <div className="w-full md:w-[400px] h-[40%] md:h-full bg-[#FBF9F2] border-r border-sand overflow-y-auto flex flex-col relative z-[10000]">
        <div className="p-8 border-b border-sand bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3 text-caramel mb-2">
            <MapPin className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.4em]">Interactive Map</span>
          </div>
          <h2 className="text-3xl font-serif font-bold italic text-ink">Certified Ateliers</h2>
          <p className="text-xs text-muted/50 mt-1 font-bold">{facilities.length} partners found near you</p>
        </div>

        <div className="flex-1 p-4 space-y-3">
          {facilities.map((f) => (
            <button
              key={f._id}
              onClick={() => handleSelectFacility(f)}
              className={`w-full text-left p-5 rounded-[2rem] border transition-all duration-300 flex gap-4 ${
                selectedFacility?._id === f._id 
                  ? "bg-white border-caramel shadow-xl shadow-caramel/5 scale-[1.02]" 
                  : "bg-white/50 border-sand/40 hover:bg-white hover:border-sand hover:shadow-lg"
              }`}
            >
              <div className="h-16 w-16 rounded-2xl bg-warm shrink-0 overflow-hidden border border-sand/30">
                <img src={f.providerAvatarUrl || "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=400"} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-black text-ink truncate mb-1">{f.providerName}</h4>
                <p className="text-[10px] text-muted/60 line-clamp-2 leading-relaxed mb-2 font-medium">{f.providerAddress}</p>
                <div className="flex flex-wrap gap-1">
                  {f.categories.slice(0, 2).map(cat => (
                    <span key={cat} className="px-2 py-0.5 bg-warm text-[8px] font-black uppercase tracking-widest text-brown/60 rounded-full border border-sand/20">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
              <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${selectedFacility?._id === f._id ? "bg-caramel text-white" : "bg-warm text-muted/30"}`}>
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative">
        <MapContainer 
          center={mapCenter} 
          zoom={mapZoom} 
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          <ChangeView center={mapCenter} zoom={mapZoom} />

          {/* User Location Marker */}
          {userLocation && (
            <Marker position={[userLocation.lat, userLocation.lng]} icon={UserIcon}>
              <Popup className="custom-popup">
                <div className="p-2 font-sans">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">You are here</p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Facility Markers */}
          {facilities.map((f) => {
            if (!f.providerLocation?.coordinates) return null;
            return (
              <Marker 
                key={f._id} 
                position={[f.providerLocation.coordinates[1], f.providerLocation.coordinates[0]]}
                icon={AtelierIcon}
                eventHandlers={{
                  click: () => setSelectedFacility(f)
                }}
              >
                <Popup className="custom-popup" minWidth={250}>
                  <div className="p-4 font-sans">
                    <div className="flex items-center gap-3 mb-4">
                       <div className="h-12 w-12 rounded-xl bg-warm overflow-hidden border border-sand">
                          <img src={f.providerAvatarUrl} className="w-full h-full object-cover" alt="" />
                       </div>
                       <div>
                          <h4 className="text-sm font-black text-ink">{f.providerName}</h4>
                          <span className="text-[9px] font-black uppercase tracking-widest text-caramel">Certified Partner</span>
                       </div>
                    </div>
                    <p className="text-xs text-muted/60 mb-4 line-clamp-2 leading-relaxed font-medium">{f.providerAddress}</p>
                    <a 
                      href={`/services/atelier/${f.providerUserId}`} 
                      className="w-full py-3 bg-ink text-white rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-caramel transition-all"
                    >
                       View Profile <Maximize2 className="w-3 h-3" />
                    </a>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Floating Controls */}
        <div className="absolute top-24 right-6 z-[10001] flex flex-col gap-4">
           {userLocation && (
              <button 
                onClick={handleGoToUser}
                className="h-12 w-12 bg-white/90 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-2xl border border-sand hover:bg-blue-50 hover:text-blue-600 transition-all group"
                title="Go to my location"
              >
                <LocateFixed className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </button>
           )}
        </div>

        {/* Floating Facility Info (when selected) */}
        <AnimatePresence>
          {selectedFacility && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-10 left-10 right-10 md:left-1/2 md:translate-x-[-50%] md:w-[500px] z-[1000] bg-white rounded-[2.5rem] shadow-2xl border border-sand p-8 flex items-center gap-6"
            >
               <div className="h-20 w-20 rounded-3xl bg-warm overflow-hidden border border-sand shrink-0">
                  <img src={selectedFacility.providerAvatarUrl} className="w-full h-full object-cover" alt="" />
               </div>
               <div className="flex-1 min-w-0">
                  <h3 className="text-xl font-serif font-bold italic text-ink mb-1 truncate">{selectedFacility.providerName}</h3>
                  <div className="flex items-start gap-2 mb-4">
                    <MapPin className="w-3.5 h-3.5 text-caramel shrink-0 mt-0.5" />
                    <p className="text-xs font-semibold text-muted/60 truncate">{selectedFacility.providerAddress}</p>
                  </div>
                  <div className="flex gap-3">
                    <a 
                      href={`/services/atelier/${selectedFacility.providerUserId}`}
                      className="px-6 py-3 bg-caramel text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-caramel/20"
                    >
                      Visit Atelier
                    </a>
                    <button className="h-10 w-10 rounded-full border border-sand flex items-center justify-center text-muted/30 hover:bg-warm transition-colors">
                      <Phone className="w-4 h-4" />
                    </button>
                  </div>
               </div>
               <button onClick={() => setSelectedFacility(null)} className="h-10 w-10 rounded-full bg-warm flex items-center justify-center text-muted/40 hover:text-ink">
                  <X className="w-4 h-4" />
               </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 2rem;
          padding: 0;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          border: 1px solid #EFEAE2;
        }
        .custom-popup .leaflet-popup-content {
          margin: 0;
          width: 300px !important;
        }
        .custom-popup .leaflet-popup-tip {
          background: white;
        }
      `}} />
    </motion.div>
  );
};
