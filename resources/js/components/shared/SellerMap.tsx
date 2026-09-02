import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import type { Seller } from '@/types/seller';

// Bundlers break Leaflet's default marker icon URL resolution — point it
// at the bundled asset URLs explicitly.
const defaultIcon = L.icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

interface Props {
    center: { lat: number; lng: number };
    sellers: Seller[];
    onSelectSeller?: (seller: Seller) => void;
    className?: string;
}

export default function SellerMap({ center, sellers, onSelectSeller, className }: Props) {
    return (
        <MapContainer
            center={[center.lat, center.lng]}
            zoom={12}
            className={className}
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {sellers
                .filter((s) => s.latitude !== null && s.longitude !== null)
                .map((seller) => (
                    <Marker
                        key={seller.id}
                        position={[seller.latitude as number, seller.longitude as number]}
                        icon={defaultIcon}
                        eventHandlers={onSelectSeller ? { click: () => onSelectSeller(seller) } : undefined}
                    >
                        <Popup>
                            <span className="font-medium">{seller.business_name}</span>
                            {seller.distance_km !== undefined && (
                                <span className="block text-xs text-muted-foreground">
                                    {seller.distance_km} km away
                                </span>
                            )}
                        </Popup>
                    </Marker>
                ))}
        </MapContainer>
    );
}
