'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useMap } from 'react-leaflet';
import * as turf from '@turf/turf';
import 'leaflet/dist/leaflet.css';
import 'leaflet-geosearch/dist/geosearch.css';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then((mod) => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((mod) => mod.TileLayer), { ssr: false });
const ZoomControl = dynamic(() => import('react-leaflet').then((mod) => mod.ZoomControl), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then((mod) => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then((mod) => mod.Popup), { ssr: false });
const GeoJSON = dynamic(() => import('react-leaflet').then((mod) => mod.GeoJSON), { ssr: false });

interface FloodMapProps {
  floodHeight: number;
  center?: [number, number];
  zoom?: number;
  baseLayer?: 'streets' | 'satellite' | 'terrain' | 'hybrid';
  showLandParcels?: boolean;
  showInfrastructure?: boolean;
  onLocationSelect?: (data: { 
    lat: number; 
    lng: number; 
    alt: number | null; 
    isSubmerged: boolean;
    parcel?: { id: string; title: string; zone: string; area: string } | null;
  }) => void;
  userLocation?: [number, number] | null;
}

// Helper component to update map view and handle events
function MapController({ 
  center, 
  zoom, 
  floodHeight,
  onLocationSelect,
  landParcels
}: { 
  center: [number, number]; 
  zoom: number;
  floodHeight: number;
  onLocationSelect?: FloodMapProps['onLocationSelect'];
  landParcels: any;
}) {
  const map = (useMap as any)();
  
  useEffect(() => {
    if (map) {
      map.setView(center, zoom, { animate: true });
    }
  }, [center, zoom, map]);

  useEffect(() => {
    if (!map || !onLocationSelect) return;

    const handleContextMenu = async (e: any) => {
      const { lat, lng } = e.latlng;
      
      // Check if point is inside any parcel
      const point = turf.point([lng, lat]);
      let foundParcel = null;
      
      if (landParcels && landParcels.features) {
        for (const feature of landParcels.features) {
          if (turf.booleanPointInPolygon(point, feature)) {
            foundParcel = feature.properties;
            break;
          }
        }
      }

      // Notify immediately with lat/lng and parcel info
      onLocationSelect({ lat, lng, alt: null, isSubmerged: false, parcel: foundParcel });

      try {
        // Fetch elevation (altitude)
        const response = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${lat},${lng}`);
        const data = await response.json();
        const alt = data.results[0].elevation;
        
        const isSubmerged = alt <= floodHeight;
        onLocationSelect({ lat, lng, alt, isSubmerged, parcel: foundParcel });
      } catch (error) {
        console.error('Error fetching elevation:', error);
        // Fallback if API fails
        onLocationSelect({ lat, lng, alt: null, isSubmerged: false, parcel: foundParcel });
      }
    };

    map.on('contextmenu', handleContextMenu);
    return () => {
      map.off('contextmenu', handleContextMenu);
    };
  }, [map, onLocationSelect, floodHeight, landParcels]);

  return null;
}

// Search Control component
function SearchControl() {
  const map = (useMap as any)();
  
  useEffect(() => {
    if (!map) return;
    
    let searchControl: any = null;

    const setupSearch = async () => {
      const { GeoSearchControl, OpenStreetMapProvider } = await import('leaflet-geosearch');
      const provider = new OpenStreetMapProvider();
      
      searchControl = new (GeoSearchControl as any)({
        provider: provider,
        style: 'button', // Changed to button to be less intrusive and avoid confusion
        showMarker: true,
        showPopup: false,
        marker: {
          draggable: false,
        },
        maxMarkers: 1,
        retainZoomLevel: false,
        animateZoom: true,
        autoClose: true,
        searchLabel: 'Search for a place...',
        keepResult: true,
      });

      map.addControl(searchControl);
    };

    setupSearch();

    return () => {
      if (searchControl && map) {
        map.removeControl(searchControl);
      }
    };
  }, [map]);

  return null;
}

export default function FloodMap({ 
  floodHeight, 
  center = [20, 0], 
  zoom = 3, 
  baseLayer = 'streets',
  showLandParcels = false,
  showInfrastructure = false,
  onLocationSelect,
  userLocation
}: FloodMapProps) {
  const floodTileUrl = `https://flood.firetree.net/solidtile/m_${floodHeight}/x_{x}/y_{y}/z_{z}`;

  const [L, setL] = useState<any>(null);

  useEffect(() => {
    import('leaflet').then((leaflet) => {
      setL(leaflet);
    });
  }, []);

  const beaconIcon = L ? L.divIcon({
    className: 'user-beacon-container',
    html: `
      <div class="user-beacon">
        <div class="user-beacon-pulse"></div>
        <div class="user-beacon-dot"></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  }) : null;

  // Mock Infrastructure Data
  const mockInfrastructure: any = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { name: "Sarawak River", type: "River", description: "Main artery of Kuching" },
        geometry: {
          type: "LineString",
          coordinates: [
            [110.30, 1.55], [110.32, 1.56], [110.34, 1.56], [110.36, 1.55], [110.38, 1.54]
          ]
        }
      },
      {
        type: "Feature",
        properties: { name: "Batu Kawa Main Drain", type: "Drain", description: "Major monsoon drain" },
        geometry: {
          type: "LineString",
          coordinates: [
            [110.31, 1.52], [110.32, 1.53], [110.33, 1.54]
          ]
        }
      },
      {
        type: "Feature",
        properties: { name: "Kuching Barrage", type: "Dam", description: "Flood control barrage and shiplock" },
        geometry: {
          type: "Point",
          coordinates: [110.40, 1.56]
        }
      }
    ]
  };

  const infraStyle = (feature: any) => {
    switch (feature.properties.type) {
      case 'River': return { color: '#2563eb', weight: 5, opacity: 0.8 };
      case 'Drain': return { color: '#0891b2', weight: 3, opacity: 0.7, dashArray: '5, 5' };
      default: return { color: '#475569', weight: 2 };
    }
  };

  const onEachInfra = (feature: any, layer: any) => {
    layer.bindPopup(`
      <div class="p-1 font-sans">
        <h3 class="font-bold text-sm text-blue-800">${feature.properties.name}</h3>
        <p class="text-[10px] text-slate-500 uppercase font-bold">${feature.properties.type}</p>
        <p class="text-[10px] mt-1 text-slate-600">${feature.properties.description}</p>
      </div>
    `);
  };

  // Mock Land Parcel Data (GeoJSON)
  const mockLandParcels: any = {
    type: "FeatureCollection",
    features: [
      {
        type: "Feature",
        properties: { id: "LOT 123", title: "Strata Title", zone: "Mixed Zone", area: "120 sqm" },
        geometry: {
          type: "Polygon",
          coordinates: [[[110.344, 1.559], [110.345, 1.559], [110.345, 1.560], [110.344, 1.560], [110.344, 1.559]]]
        }
      },
      {
        type: "Feature",
        properties: { id: "LOT 456", title: "Land Title", zone: "Residential", area: "450 sqm" },
        geometry: {
          type: "Polygon",
          coordinates: [[[110.350, 1.583], [110.352, 1.583], [110.352, 1.585], [110.350, 1.585], [110.350, 1.583]]]
        }
      },
      {
        type: "Feature",
        properties: { id: "LOT 789", title: "Agriculture", zone: "Native Area Land", area: "2.5 Acres" },
        geometry: {
          type: "Polygon",
          coordinates: [[[110.316, 1.733], [110.320, 1.733], [110.320, 1.737], [110.316, 1.737], [110.316, 1.733]]]
        }
      },
      // Adding more realistic parcels for Kuching area
      {
        type: "Feature",
        properties: { id: "LOT 1024", title: "Land Title", zone: "Commercial", area: "800 sqm" },
        geometry: {
          type: "Polygon",
          coordinates: [[[110.355, 1.555], [110.357, 1.555], [110.357, 1.557], [110.355, 1.557], [110.355, 1.555]]]
        }
      }
    ]
  };

  const parcelStyle = (feature: any) => {
    const title = feature.properties.title;
    return {
      fillColor: title === 'Strata Title' ? '#8b5cf6' : title === 'Agriculture' ? '#10b981' : '#f59e0b',
      weight: 2,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.4
    };
  };

  const onEachParcel = (feature: any, layer: any) => {
    layer.bindPopup(`
      <div class="p-1 font-sans">
        <h3 class="font-bold text-sm text-slate-800">${feature.properties.id}</h3>
        <div class="mt-2 space-y-1">
          <p class="text-[10px] flex justify-between gap-4">
            <span class="text-slate-400 uppercase font-bold">Title Type:</span>
            <span class="font-bold text-slate-700">${feature.properties.title}</span>
          </p>
          <p class="text-[10px] flex justify-between gap-4">
            <span class="text-slate-400 uppercase font-bold">Zone:</span>
            <span class="text-slate-600">${feature.properties.zone}</span>
          </p>
          <p class="text-[10px] flex justify-between gap-4">
            <span class="text-slate-400 uppercase font-bold">Area:</span>
            <span class="text-slate-600">${feature.properties.area}</span>
          </p>
        </div>
        <div class="mt-3 pt-2 border-t border-slate-100">
          <a href="https://lasis.sarawak.gov.my/elasis/" target="_blank" class="text-[10px] font-bold text-blue-600 hover:underline">View in e-Lasis →</a>
        </div>
      </div>
    `);
  };

  const baseLayers = {
    streets: {
      url: "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
      attribution: '&copy; Google Maps',
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    },
    satellite: {
      url: "https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}",
      attribution: '&copy; Google Maps',
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    },
    terrain: {
      url: "https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
      attribution: '&copy; Google Maps',
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    },
    hybrid: {
      url: "https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
      attribution: '&copy; Google Maps',
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
    }
  };

  // Mock property data for Kuching
  const mockProperties = [
    { id: 1, name: "Waterfront Residence", coords: [1.5595, 110.3444], price: "RM 850,000", risk: "High", type: "Condo", beds: 3 },
    { id: 2, name: "Petra Jaya Villa", coords: [1.5833, 110.3500], price: "RM 1,200,000", risk: "Moderate", type: "Semi-D", beds: 4 },
    { id: 3, name: "Santubong Resort", coords: [1.7333, 110.3167], price: "RM 2,500,000", risk: "Critical", type: "Bungalow", beds: 6 },
    { id: 4, name: "Bako Eco Lodge", coords: [1.7167, 110.4667], price: "RM 450,000", risk: "High", type: "Terrace", beds: 2 },
    { id: 5, name: "Tabuan Jaya Heights", coords: [1.5233, 110.3692], price: "RM 720,000", risk: "Low", type: "Terrace", beds: 4 },
  ];

  return (
    <div className="w-full h-full relative overflow-hidden bg-slate-50">
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
        zoomControl={false}
      >
        <MapController 
          center={center} 
          zoom={zoom} 
          floodHeight={floodHeight} 
          onLocationSelect={onLocationSelect} 
          landParcels={mockLandParcels}
        />
        <ZoomControl position="bottomright" />
        <SearchControl />
        
        <TileLayer
          attribution={baseLayers[baseLayer].attribution}
          url={baseLayers[baseLayer].url}
          subdomains={baseLayers[baseLayer].subdomains}
        />

        {/* Add labels on top of satellite for hybrid view */}
        {baseLayer === 'hybrid' && (
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            zIndex={10}
          />
        )}

        <TileLayer
          url={floodTileUrl}
          opacity={0.7}
          attribution='Flood data &copy; <a href="http://flood.firetree.net/">Firetree.net</a>'
          zIndex={20}
        />

        {/* Infrastructure Layer */}
        {showInfrastructure && (
          <GeoJSON 
            data={mockInfrastructure} 
            style={infraStyle}
            onEachFeature={onEachInfra}
          />
        )}

        {/* Land Parcels Layer */}
        {showLandParcels && (
          <GeoJSON 
            data={mockLandParcels} 
            style={parcelStyle}
            onEachFeature={onEachParcel}
          />
        )}

        {/* User Location Beacon */}
        {userLocation && beaconIcon && (
          <Marker position={userLocation} icon={beaconIcon}>
            <Popup>
              <div className="text-xs font-bold">You are here</div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}

