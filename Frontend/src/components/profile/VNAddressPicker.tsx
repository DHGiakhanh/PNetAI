import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { ChevronDown, MapPin, X, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LocationOption {
  value: string;
  label: string;
  code: number;
}

interface VNAddressPickerProps {
  initialValue?: string;
  onChange: (fullAddress: string) => void;
}

const VN_BASE_URL = 'https://provinces.open-api.vn/api';

export const VNAddressPicker: React.FC<VNAddressPickerProps> = ({ initialValue, onChange }) => {
  const [provinces, setProvinces] = useState<LocationOption[]>([]);
  const [districts, setDistricts] = useState<LocationOption[]>([]);
  const [wards, setWards] = useState<LocationOption[]>([]);

  const [selectedP, setSelectedP] = useState<LocationOption | null>(null);
  const [selectedD, setSelectedD] = useState<LocationOption | null>(null);
  const [selectedW, setSelectedW] = useState<LocationOption | null>(null);
  const [street, setStreet] = useState('');

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0: Prov, 1: Dist, 2: Ward
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Initial load
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const res = await axios.get(`${VN_BASE_URL}/p/`);
        const pList = res.data.map((p: any) => ({ value: p.name, label: p.name, code: p.code }));
        setProvinces(pList);
      } catch (err) { console.error(err); }
    };
    fetchProvinces();
  }, []);

  // Sync from parent
  useEffect(() => {
    const sync = async () => {
      if (!initialValue || provinces.length === 0) return;
      const parts = initialValue.split(', ').map(p => p.trim());
      
      let st = '', wN = '', dN = '', pN = '';
      if (parts.length >= 4) {
        [st, wN, dN, pN] = [parts[0], parts[parts.length-3], parts[parts.length-2], parts[parts.length-1]];
      } else if (parts.length === 3) {
        [wN, dN, pN] = parts;
      } else if (parts.length === 2) {
        [dN, pN] = parts;
      } else {
        st = initialValue;
      }

      if (parts.length >= 4 || street === '') setStreet(st);

      const foundP = provinces.find(p => pN.includes(p.value) || p.value.includes(pN));
      if (foundP && (!selectedP || foundP.code !== selectedP.code)) {
        setSelectedP(foundP);
        try {
          const dRes = await axios.get(`${VN_BASE_URL}/p/${foundP.code}?depth=2`);
          const dList = dRes.data.districts.map((d: any) => ({ value: d.name, label: d.name, code: d.code }));
          setDistricts(dList);
          
          const foundD = dList.find((d: any) => dN.includes(d.value) || d.value.includes(dN));
          if (foundD) {
            setSelectedD(foundD);
            const wRes = await axios.get(`${VN_BASE_URL}/d/${foundD.code}?depth=2`);
            const wList = wRes.data.wards.map((w: any) => ({ value: w.name, label: w.name, code: w.code }));
            setWards(wList);
            const foundW = wList.find((w: any) => wN.includes(w.value) || w.value.includes(wN));
            if (foundW) setSelectedW(foundW);
          }
        } catch (e) { console.error(e); }
      }
    };
    sync();
  }, [initialValue, provinces]);

  // Click outside to close
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleProvinceSelect = async (p: LocationOption) => {
    setSelectedP(p);
    setSelectedD(null);
    setSelectedW(null);
    setWards([]);
    setDistricts([]);
    setActiveTab(1);
    setSearchTerm('');
    try {
      const res = await axios.get(`${VN_BASE_URL}/p/${p.code}?depth=2`);
      setDistricts(res.data.districts.map((d: any) => ({ value: d.name, label: d.name, code: d.code })));
    } catch (e) { console.error(e); }
    updateParent(street, null, null, p);
  };

  const handleDistrictSelect = async (d: LocationOption) => {
    setSelectedD(d);
    setSelectedW(null);
    setWards([]);
    setActiveTab(2);
    setSearchTerm('');
    try {
      const res = await axios.get(`${VN_BASE_URL}/d/${d.code}?depth=2`);
      setWards(res.data.wards.map((w: any) => ({ value: w.name, label: w.name, code: w.code })));
    } catch (e) { console.error(e); }
    updateParent(street, null, d, selectedP);
  };

  const handleWardSelect = (w: LocationOption) => {
    setSelectedW(w);
    setIsOpen(false);
    setSearchTerm('');
    updateParent(street, w, selectedD, selectedP);
  };

  const updateParent = (s: string, w: LocationOption|null, d: LocationOption|null, p: LocationOption|null) => {
    const parts = [s.trim(), w?.label, d?.label, p?.label].filter(Boolean);
    onChange(parts.join(', '));
  };

  const getCurrentOptions = () => {
    const list = activeTab === 0 ? provinces : activeTab === 1 ? districts : wards;
    if (!searchTerm) return list;
    return list.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()));
  };

  const getFullLabel = () => {
    const parts = [selectedP?.label, selectedD?.label, selectedW?.label].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Province, District, Ward...';
  };

  return (
    <div className="space-y-4" ref={containerRef}>
      {/* Main Select Input */}
      <div className="relative group">
        <label className="absolute -top-2.5 left-5 bg-white px-2 text-[10px] font-bold text-muted uppercase tracking-widest z-10">
          Location
        </label>
        <div 
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-full h-16 bg-white border cursor-pointer rounded-3xl px-6 flex items-center justify-between transition-all
            ${isOpen ? 'border-caramel ring-4 ring-caramel/5 shadow-lg' : 'border-sand group-hover:border-caramel/50'}
          `}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <MapPin className={`w-4 h-4 ${selectedP ? 'text-caramel' : 'text-muted/40'}`} />
            <span className={`text-sm font-bold truncate ${selectedP ? 'text-ink' : 'text-muted/40'}`}>
              {getFullLabel()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {selectedP && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedP(null); setSelectedD(null); setSelectedW(null);
                  setDistricts([]); setWards([]); setActiveTab(0);
                  updateParent(street, null, null, null);
                }}
                className="p-1 hover:bg-warm rounded-full text-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <ChevronDown className={`w-5 h-5 text-muted/60 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Dropdown Panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute top-full left-0 right-0 mt-3 bg-white border border-sand rounded-[2rem] shadow-2xl z-[100] overflow-hidden"
            >
              {/* Tabs */}
              <div className="flex border-b border-sand bg-warm/10">
                {[
                  { label: 'Province', active: activeTab === 0 },
                  { label: 'District', active: activeTab === 1, disabled: !selectedP },
                  { label: 'Ward', active: activeTab === 2, disabled: !selectedD }
                ].map((tab, idx) => (
                  <button
                    key={idx}
                    disabled={tab.disabled}
                    onClick={() => setActiveTab(idx)}
                    className={`
                      flex-1 py-4 text-[10px] font-bold uppercase tracking-widest relative overflow-hidden transition-all
                      ${tab.active ? 'text-caramel' : 'text-muted opacity-50'}
                      ${tab.disabled ? 'cursor-not-allowed' : 'hover:bg-warm/50'}
                    `}
                  >
                    {tab.label}
                    {tab.active && (
                      <motion.div 
                        layoutId="activeTabUnderline"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-caramel"
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="p-4 border-b border-sand/50 bg-cream/30">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted/40" />
                  <input 
                    type="text"
                    placeholder={`Search ${activeTab === 0 ? 'province' : activeTab === 1 ? 'district' : 'ward'}...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-sand/60 rounded-xl py-2 pl-9 pr-4 text-xs font-bold text-ink focus:border-caramel outline-none transition-all"
                  />
                </div>
              </div>

              {/* Options List */}
              <div className="max-h-72 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-sand scrollbar-track-transparent">
                <div className="grid grid-cols-1 gap-1">
                  {getCurrentOptions().length === 0 ? (
                    <div className="p-10 text-center text-muted/40 text-xs font-medium italic">
                      No results found
                    </div>
                  ) : (
                    getCurrentOptions().map((opt) => (
                      <button
                        key={opt.code}
                        onClick={() => {
                          if (activeTab === 0) handleProvinceSelect(opt);
                          else if (activeTab === 1) handleDistrictSelect(opt);
                          else handleWardSelect(opt);
                        }}
                        className={`
                          w-full p-4 text-left rounded-2xl text-[13px] font-bold transition-all
                          ${(activeTab === 0 && selectedP?.code === opt.code) || 
                            (activeTab === 1 && selectedD?.code === opt.code) || 
                            (activeTab === 2 && selectedW?.code === opt.code)
                            ? 'bg-caramel text-white shadow-lg' 
                            : 'text-ink hover:bg-warm hover:pl-6'}
                        `}
                      >
                        {opt.label}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Street Input */}
      <div className="relative group">
        <label className="absolute -top-2.5 left-5 bg-[#FBF9F2] px-2 text-[10px] font-bold text-muted uppercase tracking-widest z-10 group-focus-within:text-caramel transition-colors">
          Street Details
        </label>
        <input 
          type="text" 
          value={street}
          onChange={(e) => { setStreet(e.target.value); updateParent(e.target.value, selectedW, selectedD, selectedP); }}
          placeholder="House number, street name, building..."
          className="w-full bg-white border border-sand rounded-3xl h-16 px-6 text-sm font-bold text-ink outline-none focus:border-caramel focus:ring-4 focus:ring-caramel/5 transition-all"
        />
      </div>
    </div>
  );
};
