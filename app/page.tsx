'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Waves, 
  Info, 
  Map as MapIcon, 
  Layers, 
  AlertTriangle, 
  Navigation2,
  ChevronRight,
  Droplets,
  Locate,
  Car,
  Wind,
  CloudSun,
  Landmark,
  ShoppingBag,
  Newspaper,
  Search,
  Menu,
  X
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

const FloodMap = dynamic(() => import('@/components/FloodMap'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-100 animate-pulse" />
});

export default function Home() {
  const [floodHeight, setFloodHeight] = useState(7); // Default to 7m
  const [tideLevel, setTideLevel] = useState(0); // Tide influence in meters
  const [showInfo, setShowInfo] = useState(true);
  const [baseLayer, setBaseLayer] = useState<'streets' | 'satellite' | 'terrain' | 'hybrid'>('streets');
  const [showLandParcels, setShowLandParcels] = useState(false);
  const [showInfrastructure, setShowInfrastructure] = useState(false);
  const [activeTab, setActiveTab] = useState<'simulation' | 'market' | 'news'>('simulation');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    alt: number | null;
    isSubmerged: boolean;
    parcel?: { id: string; title: string; zone: string; area: string } | null;
  } | null>(null);
  
  // Default location: Kuching, Sarawak
  const [mapCenter, setMapCenter] = useState<[number, number]>([1.5533, 110.3592]);
  const [mapZoom, setMapZoom] = useState(12);
  const [isLocating, setIsLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const isFirstFixRef = useRef(true);

  useEffect(() => {
    if (isTracking) {
      if (!navigator.geolocation) {
        setTimeout(() => setIsTracking(false), 0);
        return;
      }

      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation([latitude, longitude]);
          
          if (isFirstFixRef.current) {
            setMapCenter([latitude, longitude]);
            setMapZoom(18);
            isFirstFixRef.current = false;
          }
        },
        (error) => {
          console.error('Tracking error:', error);
          setTimeout(() => setIsTracking(false), 0);
        },
        { enableHighAccuracy: true }
      );
    } else {
      isFirstFixRef.current = true;
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [isTracking]);

  const getImpactLevel = (height: number) => {
    if (height <= 2) return { label: 'Low', color: 'bg-blue-500' };
    if (height <= 10) return { label: 'Moderate', color: 'bg-yellow-500' };
    if (height <= 30) return { label: 'High', color: 'bg-orange-500' };
    return { label: 'Critical', color: 'bg-red-600' };
  };

  const impact = getImpactLevel(floodHeight);

  const handleLocationClick = (coords: [number, number], zoom: number) => {
    setMapCenter(coords);
    setMapZoom(zoom);
  };

  const handleLocateMe = () => {
    if (isTracking) {
      setIsTracking(false);
      setUserLocation(null);
      return;
    }

    if (!navigator.geolocation) {
      return;
    }

    setIsTracking(true);
  };

  return (
    <main className="flex h-screen w-full bg-[#f8f9fa] text-slate-900 font-sans overflow-hidden relative">
      {/* Mobile Toggle Button */}
      <button 
        onClick={() => setIsSidebarOpen(true)}
        className="lg:hidden absolute top-6 left-6 z-[1001] p-3 bg-white shadow-lg rounded-full text-slate-600 hover:text-blue-600 transition-colors"
      >
        <Menu size={24} />
      </button>

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[1002]"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 w-80 h-full border-r border-slate-200 bg-white flex flex-col shadow-sm z-[1003]
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-600 rounded-lg text-white">
              <Waves size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">AquaScope Kuching</h1>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>
        <div className="px-6 pb-2">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Sarawak Flood Risk</p>
        </div>

        <Separator className="bg-slate-100" />

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100">
          {[
            { id: 'simulation', icon: Waves, label: 'Sim' },
            { id: 'market', icon: ShoppingBag, label: 'Market' },
            { id: 'news', icon: Newspaper, label: 'News' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 flex flex-col items-center gap-1 transition-colors ${
                activeTab === tab.id 
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/30' 
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <tab.icon size={18} />
              <span className="text-[9px] font-bold uppercase tracking-tighter">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {activeTab === 'simulation' && (
            <>
              {/* Controls Section */}
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                    <Layers size={16} className="text-slate-400" />
                    Map Settings
                  </h2>
                </div>
                
                <Card className="border-slate-100 shadow-none bg-slate-50/50">
                  <CardContent className="pt-6 space-y-6">
                    {/* Base Layer Selection */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Google Maps View</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['streets', 'satellite', 'terrain', 'hybrid'] as const).map((layer) => (
                      <button
                        key={layer}
                        onClick={() => setBaseLayer(layer)}
                        className={`py-2 px-1 text-[10px] font-bold uppercase rounded border transition-all ${
                          baseLayer === layer 
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm' 
                            : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {layer}
                      </button>
                    ))}
                  </div>
                </div>

                <Separator className="bg-slate-200/50" />

                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Sea Level Rise</label>
                      <span className="text-2xl font-mono font-bold text-blue-600 leading-none">+{floodHeight}m</span>
                    </div>
                    <Slider
                      value={[floodHeight]}
                      onValueChange={(vals) => {
                        const val = Array.isArray(vals) ? vals[0] : vals;
                        setFloodHeight(val);
                      }}
                      max={60}
                      step={1}
                      className="py-4"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Tide Influence</label>
                      <span className="text-lg font-mono font-bold text-cyan-600 leading-none">+{tideLevel}m</span>
                    </div>
                    <Slider
                      value={[tideLevel]}
                      onValueChange={(vals) => {
                        const val = Array.isArray(vals) ? vals[0] : vals;
                        setTideLevel(val);
                      }}
                      max={5}
                      step={0.5}
                      className="py-4"
                    />
                    <p className="text-[9px] text-slate-400 italic">Simulates Kuching&apos;s high tide effect on river levels.</p>
                  </div>

                <Separator className="bg-slate-200/50" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Property Risk Layer</label>
                    <Badge variant="outline" className="text-[9px] uppercase tracking-tighter text-slate-400 border-slate-200">Experimental</Badge>
                  </div>

                  <button
                    onClick={() => setShowLandParcels(!showLandParcels)}
                    className={`w-full py-2 px-3 text-xs font-semibold rounded border flex items-center justify-between transition-all ${
                      showLandParcels 
                        ? 'bg-purple-50 border-purple-200 text-purple-700' 
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Layers size={14} />
                      Land Parcels (LASIS)
                    </span>
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${showLandParcels ? 'bg-purple-600' : 'bg-slate-200'}`}>
                      <div className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-all ${showLandParcels ? 'right-1' : 'left-1'}`} />
                    </div>
                  </button>

                  <button
                    onClick={() => setShowInfrastructure(!showInfrastructure)}
                    className={`w-full py-2 px-3 text-xs font-semibold rounded border flex items-center justify-between transition-all ${
                      showInfrastructure 
                        ? 'bg-cyan-50 border-cyan-200 text-cyan-700' 
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Droplets size={14} />
                      Hydraulic Infra
                    </span>
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${showInfrastructure ? 'bg-cyan-600' : 'bg-slate-200'}`}>
                      <div className={`absolute top-1 w-2 h-2 bg-white rounded-full transition-all ${showInfrastructure ? 'right-1' : 'left-1'}`} />
                    </div>
                  </button>
                </div>

                <Separator className="bg-slate-200/50" />

                <div className="pt-2">
                  <div className="flex items-center justify-between p-3 bg-white rounded-md border border-slate-100">
                    <span className="text-xs font-medium text-slate-600">Risk Level</span>
                    <Badge className={`${impact.color} text-white border-none shadow-sm`}>
                      {impact.label}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Impact Stats */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                <AlertTriangle size={16} className="text-slate-400" />
                {selectedLocation ? 'Location Analysis' : 'Projected Impact'}
              </h2>
              {selectedLocation && (
                <button 
                  onClick={() => setSelectedLocation(null)}
                  className="text-[10px] font-bold text-blue-600 uppercase hover:underline"
                >
                  Clear Pin
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {selectedLocation ? (
                <>
                  {selectedLocation.parcel && (
                    <div className="p-4 rounded-lg bg-purple-50 border border-purple-100 space-y-2 mb-3">
                      <p className="text-[10px] text-purple-400 uppercase font-bold tracking-wider">Land Parcel Info</p>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-800">{selectedLocation.parcel.id}</p>
                        <p className="text-xs text-slate-600">{selectedLocation.parcel.title}</p>
                        <p className="text-[10px] text-slate-500">{selectedLocation.parcel.zone} • {selectedLocation.parcel.area}</p>
                      </div>
                    </div>
                  )}
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 space-y-2">
                    <div className="flex justify-between items-start">
                      <p className="text-[10px] text-blue-400 uppercase font-bold tracking-wider">Coordinates</p>
                      <Badge variant="outline" className="text-[9px] bg-white border-blue-200 text-blue-600">Active Pin</Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-mono text-slate-600">Lat: {selectedLocation.lat.toFixed(4)}</p>
                      <p className="text-xs font-mono text-slate-600">Lng: {selectedLocation.lng.toFixed(4)}</p>
                      <p className="text-xs font-mono font-bold text-slate-800">
                        Alt: {selectedLocation.alt !== null ? `${selectedLocation.alt}m` : 'Fetching...'}
                      </p>
                    </div>
                    <div className="pt-2">
                      <a 
                        href={`https://landsurvey.sarawak.gov.my/elasis/`} 
                        target="_blank"
                        className="w-full flex items-center justify-center gap-2 py-1.5 bg-white border border-blue-100 rounded text-[10px] font-bold text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        Search in e-Lasis
                        <ChevronRight size={12} />
                      </a>
                    </div>
                  </div>
                  <div className={`p-4 rounded-lg border space-y-1 mt-3 transition-colors ${
                    selectedLocation.alt === null ? 'bg-slate-50 border-slate-100' :
                    selectedLocation.alt <= (floodHeight + tideLevel) ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'
                  }`}>
                    <p className="text-[10px] uppercase font-bold tracking-wider opacity-60">Status at +{floodHeight + tideLevel}m</p>
                    <p className={`text-lg font-semibold ${
                      selectedLocation.alt === null ? 'text-slate-400' :
                      selectedLocation.alt <= (floodHeight + tideLevel) ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {selectedLocation.alt === null ? 'Calculating...' : 
                       selectedLocation.alt <= (floodHeight + tideLevel) ? 'Submerged' : 'Safe'}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-4 rounded-lg bg-white border border-slate-100 space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Coastal Displacement</p>
                    <p className="text-lg font-semibold text-slate-800">
                      {floodHeight > 0 ? `${(floodHeight * 1.2).toFixed(1)}%` : '0%'}
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-white border border-slate-100 space-y-1">
                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Infrastructure Risk</p>
                    <p className="text-lg font-semibold text-slate-800">
                      {floodHeight > 5 ? 'High' : floodHeight > 0 ? 'Elevated' : 'Minimal'}
                    </p>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Quick Locations */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                <Navigation2 size={16} className="text-slate-400" />
                Hotspots
              </h2>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLocateMe}
                disabled={isLocating}
                className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1 text-[10px] font-bold uppercase tracking-wider"
              >
                <Locate size={12} className={isLocating ? 'animate-spin' : ''} />
                {isLocating ? 'Locating...' : 'My Location'}
              </Button>
            </div>
            <div className="space-y-2">
              {[
                { name: 'Kuching Waterfront', coords: [1.5595, 110.3444], zoom: 15 },
                { name: 'Petra Jaya', coords: [1.5833, 110.3500], zoom: 14 },
                { name: 'Santubong', coords: [1.7333, 110.3167], zoom: 13 },
                { name: 'Bako National Park', coords: [1.7167, 110.4667], zoom: 13 },
              ].map((loc) => (
                <button
                  key={loc.name}
                  onClick={() => handleLocationClick(loc.coords as [number, number], loc.zoom)}
                  className="w-full flex items-center justify-between p-3 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-100 rounded-md transition-colors group"
                >
                  {loc.name}
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                </button>
              ))}
            </div>
          </section>
            </>
          )}

          {activeTab === 'market' && (
            <div className="space-y-6">
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                    <ShoppingBag size={16} className="text-slate-400" />
                    Property Market
                  </h2>
                  <Badge variant="outline" className="text-[9px] uppercase text-blue-600 border-blue-100">Live</Badge>
                </div>
                
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                      type="text" 
                      placeholder="Search houses, condos..." 
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-md text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { name: 'Waterfront Residence', price: 'RM 850,000', type: 'Condo', risk: 'High', coords: [1.5595, 110.3444] },
                      { name: 'Petra Jaya Villa', price: 'RM 1.2M', type: 'Semi-D', risk: 'Moderate', coords: [1.5833, 110.3500] },
                      { name: 'Tabuan Jaya Heights', price: 'RM 720,000', type: 'Terrace', risk: 'Low', coords: [1.5233, 110.3692] }
                    ].map((item) => (
                      <Card 
                        key={item.name} 
                        onClick={() => handleLocationClick(item.coords as [number, number], 16)}
                        className="border-slate-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                      >
                        <CardContent className="p-3 space-y-2">
                          <div className="flex justify-between items-start">
                            <h3 className="text-xs font-bold text-slate-800 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                              <Locate size={12} className="text-blue-500" />
                              {item.name}
                            </h3>
                            <Badge variant="secondary" className="text-[8px] px-1 py-0">{item.type}</Badge>
                          </div>
                          <p className="text-sm font-bold text-blue-600">{item.price}</p>
                          <div className="flex items-center justify-between pt-1 border-t border-slate-50">
                            <span className="text-[9px] text-slate-400 uppercase font-bold">Flood Risk</span>
                            <span className={`text-[9px] font-bold ${
                              item.risk === 'High' ? 'text-red-500' : item.risk === 'Moderate' ? 'text-yellow-600' : 'text-green-600'
                            }`}>{item.risk}</span>
                          </div>
                          <div className="pt-2 flex gap-2">
                            <a 
                              href="https://www.propertyguru.com.my/property-for-sale/in-sarawak" 
                              target="_blank"
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 text-center py-1 bg-slate-50 rounded text-[8px] font-bold text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                            >
                              PropertyGuru
                            </a>
                            <a 
                              href="https://www.sarawakprojects.com/" 
                              target="_blank"
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 text-center py-1 bg-slate-50 rounded text-[8px] font-bold text-slate-500 hover:bg-blue-50 hover:text-blue-600"
                            >
                              SarawakProjects
                            </a>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'news' && (
            <div className="space-y-6">
              <section className="space-y-4">
                <h2 className="text-sm font-semibold flex items-center gap-2 text-slate-700">
                  <Newspaper size={16} className="text-slate-400" />
                  Land & Housing News
                </h2>
                
                <div className="space-y-4">
                  {[
                    { title: 'Official Land & Survey News Updates', date: 'Live', source: 'Land & Survey Dept', url: 'https://landsurvey.sarawak.gov.my/web/subpage/news_list/' },
                    { title: 'Sarawak Housing and Real Estate News', date: 'Today', source: 'DayakDaily', url: 'https://dayakdaily.com/category/sarawak/business/' },
                    { title: 'Infrastructure and Development Projects', date: 'Yesterday', source: 'DayakDaily', url: 'https://dayakdaily.com/category/sarawak/' },
                    { title: 'LASIS e-Services and Land Title Updates', date: 'Recent', source: 'e-Lasis', url: 'https://landsurvey.sarawak.gov.my/web/subpage/news_list/' }
                  ].map((news, i) => (
                    <a 
                      key={i} 
                      href={news.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block space-y-1 group cursor-pointer"
                    >
                      <p className="text-[10px] text-blue-500 font-bold uppercase tracking-tighter">{news.source} • {news.date}</p>
                      <h3 className="text-xs font-medium text-slate-700 group-hover:text-blue-600 transition-colors leading-snug">{news.title}</h3>
                      <Separator className="mt-3 bg-slate-50" />
                    </a>
                  ))}
                  <div className="pt-2">
                    <a 
                      href="https://dayakdaily.com/?s=housing+land" 
                      target="_blank" 
                      className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      Search DayakDaily for Land News <ChevronRight size={12} />
                    </a>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
            <Droplets size={12} />
            <span>Data provided by Firetree.net</span>
          </div>
        </div>
      </div>

      {/* Map Area */}
      <div className="flex-1 relative bg-slate-200">
        <FloodMap 
          floodHeight={floodHeight + tideLevel} 
          center={mapCenter} 
          zoom={mapZoom} 
          baseLayer={baseLayer}
          showLandParcels={showLandParcels}
          showInfrastructure={showInfrastructure}
          onLocationSelect={setSelectedLocation}
          userLocation={userLocation}
        />

        {/* Floating Info Box */}
        <div className="absolute top-24 lg:top-6 left-6 z-[1000] pointer-events-none">
          <Card className="shadow-lg border-none bg-white/90 backdrop-blur-md p-2 lg:p-3 pointer-events-auto">
            <div className="flex items-center gap-2 lg:gap-3">
              <div className="p-1.5 lg:p-2 bg-blue-50 rounded-full text-blue-600">
                <CloudSun size={16} className="lg:w-5 lg:h-5" />
              </div>
              <div>
                <p className="text-[8px] lg:text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-0.5 lg:mb-1">Kuching Weather</p>
                <div className="flex items-baseline gap-1.5 lg:gap-2">
                  <span className="text-sm lg:text-lg font-bold text-slate-800 leading-none">28°C</span>
                  <span className="text-[10px] lg:text-xs text-slate-500 font-medium leading-none">Thunderstorms</span>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <AnimatePresence>
          {showInfo && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute top-6 right-6 w-64 lg:w-72 z-[1000]"
            >
              <Card className="shadow-xl border-none bg-white/90 backdrop-blur-md">
                <div className="p-3 lg:p-4 pb-1 lg:pb-2 flex flex-row items-center justify-between">
                  <h3 className="text-xs lg:text-sm font-bold flex items-center gap-2">
                    <Info size={14} className="text-blue-600 lg:w-4 lg:h-4" />
                    How it works
                  </h3>
                  <button 
                    onClick={() => setShowInfo(false)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    <ChevronRight size={14} className="rotate-90 lg:w-4 lg:h-4" />
                  </button>
                </div>
                <CardContent className="text-[10px] lg:text-[11px] leading-relaxed text-slate-600 space-y-1.5 lg:space-y-2 p-3 lg:p-4 pt-0 lg:pt-0">
                  <p>
                    This simulation uses global elevation data to visualize the impact of sea level rise.
                  </p>
                  <p className="hidden lg:block">
                    The blue overlay represents areas that would be submerged at the selected height above current sea level.
                  </p>
                  <div className="p-1.5 lg:p-2 bg-blue-50 rounded border border-blue-100 text-blue-700 font-medium flex items-center gap-2">
                    <AlertTriangle size={10} className="lg:w-3 lg:h-3" />
                    <span>Visual simulation only.</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Map Legend */}
        <div className="absolute bottom-20 lg:bottom-6 left-6 z-[1000] flex flex-col lg:flex-row gap-2">
          <Badge variant="outline" className="bg-white/80 backdrop-blur shadow-sm border-slate-200 text-slate-600 px-2 lg:px-3 py-1 text-[10px] lg:text-xs">
            <div className="w-2 h-2 lg:w-3 lg:h-3 rounded-full bg-blue-500/70 mr-1.5 lg:mr-2 border border-blue-600/30" />
            Submerged Area
          </Badge>
          <Badge variant="outline" className="bg-white/80 backdrop-blur shadow-sm border-slate-200 text-slate-600 px-2 lg:px-3 py-1 text-[10px] lg:text-xs">
            <MapIcon size={10} className="mr-1.5 lg:mr-2 lg:w-3 lg:h-3" />
            Google Maps
          </Badge>
        </div>

        {/* Floating Locate Button (Google Maps Style) */}
        <div className="absolute bottom-32 lg:bottom-24 right-3 lg:right-6 z-[1000]">
          <Button
            onClick={handleLocateMe}
            className={`w-10 h-10 lg:w-12 lg:h-12 rounded-full shadow-xl border-none transition-all p-0 flex items-center justify-center ${
              isTracking 
                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                : 'bg-white text-slate-600 hover:text-blue-600 hover:bg-blue-50'
            }`}
            title={isTracking ? "Stop tracking" : "Show my location"}
          >
            <Locate size={20} className={`lg:w-6 lg:h-6 ${isTracking ? 'animate-pulse' : ''}`} />
          </Button>
        </div>
      </div>
    </main>
  );
}
