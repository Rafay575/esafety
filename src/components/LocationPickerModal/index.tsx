"use client";

import React, { useEffect, useRef, useState } from "react";
import { useJsApiLoader, GoogleMap, Marker } from "@react-google-maps/api";
import Button from "@/components/Base/Button";

const mapContainerStyle = { width: "100%", height: "400px" };
const defaultCenter = { lat: 33.6844, lng: 73.0479 }; // fallback (Islamabad)

// Safely get the Google Maps API key
const getGoogleMapsApiKey = (): string => {
  // Next.js style
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  }
  // Vite style (must be prefixed with VITE_)
  if (typeof import.meta !== 'undefined' && import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
    return import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  }
  console.error("Google Maps API key is missing. Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY or VITE_GOOGLE_MAPS_API_KEY");
  return "";
};

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialLat?: number;
  initialLng?: number;
  initialAddress?: string;
  onSave: (lat: number, lng: number, address: string) => void;
}

export default function LocationPickerModal({
  isOpen,
  onClose,
  initialLat,
  initialLng,
  initialAddress,
  onSave,
}: Props) {
  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: getGoogleMapsApiKey(),
    libraries: ["places"],
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [markerPosition, setMarkerPosition] = useState(
    initialLat && initialLng ? { lat: initialLat, lng: initialLng } : defaultCenter
  );
  const [address, setAddress] = useState(initialAddress || "");
  const [searchInput, setSearchInput] = useState("");

  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLoaded && !geocoderRef.current) {
      geocoderRef.current = new window.google.maps.Geocoder();
    }
  }, [isLoaded]);

  useEffect(() => {
    if (!isLoaded || !map) return;

    const input = document.getElementById("autocomplete-input") as HTMLInputElement;
    if (!input) return;

    const autocomplete = new window.google.maps.places.Autocomplete(input, {
      types: ["geocode"],
    });
    autocomplete.bindTo("bounds", map);

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry?.location) return;

      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      setMarkerPosition({ lat, lng });
      setAddress(place.formatted_address || "");
      map.panTo({ lat, lng });
      map.setZoom(15);
    });

    autocompleteRef.current = autocomplete;

    return () => {
      if (autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [isLoaded, map]);

  const onMapLoad = (mapInstance: google.maps.Map) => {
    setMap(mapInstance);
  };

  const onMarkerDragEnd = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return;
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();
    setMarkerPosition({ lat, lng });

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      if (geocoderRef.current) {
        geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === "OK" && results?.[0]) {
            setAddress(results[0].formatted_address);
          } else {
            setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          }
        });
      }
    }, 300);
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setMarkerPosition({ lat: latitude, lng: longitude });

        if (geocoderRef.current) {
          geocoderRef.current.geocode({ location: { lat: latitude, lng: longitude } }, (results, status) => {
            if (status === "OK" && results?.[0]) {
              setAddress(results[0].formatted_address);
            } else {
              setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            }
          });
        }

        if (map) {
          map.panTo({ lat: latitude, lng: longitude });
          map.setZoom(15);
        }
      },
      () => alert("Unable to retrieve your location.")
    );
  };

  const handleSave = () => {
    onSave(markerPosition.lat, markerPosition.lng, address);
    onClose();
  };

  if (!isOpen) return null;

  if (loadError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <h3 className="text-lg font-semibold text-slate-800">Error loading map</h3>
          <p className="mt-2 text-sm text-slate-600">
            Could not load Google Maps. Please check your API key or try again later.
          </p>
          <div className="mt-4 flex justify-end">
            <Button onClick={onClose} variant="outline-secondary">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
          <p className="text-slate-600">Loading map…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-semibold text-slate-800">Pick a location</h2>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              id="autocomplete-input"
              type="text"
              placeholder="Search for a place..."
              className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-primary focus:outline-none"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            <Button type="button" variant="outline-secondary" onClick={handleUseCurrentLocation}>
              Use my location
            </Button>
          </div>

          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={markerPosition}
            zoom={15}
            onLoad={onMapLoad}
          >
            <Marker position={markerPosition} draggable onDragEnd={onMarkerDragEnd} />
          </GoogleMap>

          <div>
            <p className="text-sm font-medium text-slate-700">Selected address:</p>
            <p className="mt-1 rounded-lg bg-slate-50 p-2 text-sm text-slate-600">
              {address || "—"}
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline-secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="button" variant="primary" onClick={handleSave}>
              Save location
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}