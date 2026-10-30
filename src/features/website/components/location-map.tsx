'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';

// Centre du Maroc quand aucune position n'est encore définie
const DEFAULT_CENTER: [number, number] = [31.79, -7.09];

const pinIcon = L.divIcon({
  className: '',
  iconSize: [28, 40],
  iconAnchor: [14, 40],
  html: `<svg width="28" height="40" viewBox="0 0 28 40" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.3 21.7 0 14 0z" fill="#dc2626"/>
    <circle cx="14" cy="14" r="5.5" fill="#fff"/></svg>`,
});

export interface LatLng { lat: number; lng: number }

interface Props {
  value: LatLng | null;
  onChange: (value: LatLng) => void;
  height?: number;
}

function ClickHandler({ onChange }: { onChange: (v: LatLng) => void }) {
  useMapEvents({ click: (e) => onChange({ lat: e.latlng.lat, lng: e.latlng.lng }) });
  return null;
}

function Recenter({ value }: { value: LatLng | null }) {
  const map = useMap();
  useEffect(() => {
    if (value && !map.getBounds().contains([value.lat, value.lng])) {
      map.setView([value.lat, value.lng], Math.max(map.getZoom(), 14));
    }
  }, [value, map]);
  return null;
}

/**
 * Carte OpenStreetMap : un clic (ou un glisser du repère) fixe la position.
 * Chargée sans SSR (Leaflet a besoin de window).
 */
export default function LocationMap({ value, onChange, height = 320 }: Props) {
  const round = (n: number) => Math.round(n * 1e6) / 1e6;
  const set = (v: LatLng) => onChange({ lat: round(v.lat), lng: round(v.lng) });

  return (
    <div className="overflow-hidden rounded-lg border" style={{ height }}>
      <MapContainer
        center={value ? [value.lat, value.lng] : DEFAULT_CENTER}
        zoom={value ? 15 : 5}
        // The map sits inside a long form: the wheel scrolls the page, zoom uses the +/- buttons
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickHandler onChange={set} />
        <Recenter value={value} />
        {value && (
          <Marker
            position={[value.lat, value.lng]}
            icon={pinIcon}
            draggable
            eventHandlers={{ dragend: (e) => set((e.target as L.Marker).getLatLng()) }}
          />
        )}
      </MapContainer>
    </div>
  );
}
