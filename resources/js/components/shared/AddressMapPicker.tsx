import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { Input } from '@/components/ui/input';

const defaultIcon = L.icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

interface NominatimResult {
    display_name: string;
    lat: string;
    lon: string;
}

interface Props {
    latitude: number | null;
    longitude: number | null;
    onChange: (latitude: number, longitude: number, label?: string) => void;
    className?: string;
}

const FALLBACK_CENTER: [number, number] = [0, 0];
const FALLBACK_ZOOM = 2;
const PIN_ZOOM = 15;

function ClickToPlacePin({ onPick }: { onPick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onPick(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

function RecenterOnChange({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, zoom);
    }, [center[0], center[1], zoom]);
    return null;
}

/**
 * Shared location picker (OpenStreetMap/Leaflet + Nominatim geocoding) —
 * search an address or click/drag the pin. Only emits coordinates (+ an
 * optional suggested label from search); surrounding address fields stay
 * separate text inputs owned by the parent form.
 *
 * Nominatim usage policy: search requests are debounced and capped to
 * avoid bulk/automated geocoding — see https://operations.osmfoundation.org/policies/nominatim/
 */
export default function AddressMapPicker({ latitude, longitude, onChange, className }: Props) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<NominatimResult[]>([]);
    const [searching, setSearching] = useState(false);
    const [open, setOpen] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const hasPin = latitude !== null && longitude !== null;
    const center: [number, number] = hasPin ? [latitude, longitude] : FALLBACK_CENTER;
    const zoom = hasPin ? PIN_ZOOM : FALLBACK_ZOOM;

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (query.trim().length < 3) {
            setResults([]);
            return;
        }

        debounceRef.current = setTimeout(async () => {
            setSearching(true);
            try {
                const response = await fetch(
                    `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(query)}`,
                );
                const data = (await response.json()) as NominatimResult[];
                setResults(data);
                setOpen(true);
            } finally {
                setSearching(false);
            }
        }, 500);

        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
    }, [query]);

    function pickResult(result: NominatimResult) {
        onChange(parseFloat(result.lat), parseFloat(result.lon), result.display_name);
        setQuery(result.display_name);
        setResults([]);
        setOpen(false);
    }

    return (
        <div className={className}>
            <div className="relative">
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => results.length > 0 && setOpen(true)}
                    placeholder="Search an address…"
                    aria-label="Search an address"
                />
                {open && results.length > 0 && (
                    <ul className="absolute z-[1000] mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow-md">
                        {results.map((result, i) => (
                            <li key={i}>
                                <button
                                    type="button"
                                    onClick={() => pickResult(result)}
                                    className="block w-full px-3 py-2 text-left text-sm hover:bg-accent"
                                >
                                    {result.display_name}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                {searching && <p className="mt-1 text-xs text-muted-foreground">Searching…</p>}
            </div>

            <div className="mt-2 h-64 overflow-hidden rounded-lg border">
                <MapContainer center={center} zoom={zoom} style={{ height: '100%', width: '100%' }}>
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <RecenterOnChange center={center} zoom={zoom} />
                    <ClickToPlacePin onPick={(lat, lng) => onChange(lat, lng)} />
                    {hasPin && (
                        <Marker
                            position={center}
                            icon={defaultIcon}
                            draggable
                            eventHandlers={{
                                dragend: (e) => {
                                    const pos = e.target.getLatLng();
                                    onChange(pos.lat, pos.lng);
                                },
                            }}
                        />
                    )}
                </MapContainer>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
                Search for an address, or click/drag the pin to set your exact location.
            </p>
        </div>
    );
}
