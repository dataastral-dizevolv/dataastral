"use client";

import { useEffect, useState } from "react";

import type { LocationData } from "@/types/calculator";

const COUNTRY_TIMEZONE_FALLBACK: Record<string, string> = {
  brasil: "America/Sao_Paulo",
  brazil: "America/Sao_Paulo",
  portugal: "Europe/Lisbon",
  espanha: "Europe/Madrid",
  spain: "Europe/Madrid",
  argentina: "America/Argentina/Buenos_Aires",
  chile: "America/Santiago",
  uruguai: "America/Montevideo",
  uruguay: "America/Montevideo",
  paraguai: "America/Asuncion",
  paraguay: "America/Asuncion",
  colombia: "America/Bogota",
  peru: "America/Lima",
  mexico: "America/Mexico_City",
  "estados unidos": "America/New_York",
  "united states": "America/New_York",
};

function getTimezoneFromCountry(country: string) {
  return COUNTRY_TIMEZONE_FALLBACK[country.trim().toLowerCase()] ?? null;
}

function getTimezoneFromLongitude(longitude: number) {
  const utcOffset = Math.max(-12, Math.min(14, Math.round(longitude / 15)));

  if (utcOffset === 0) {
    return "Etc/UTC";
  }

  const etcGmtOffset = -utcOffset;
  const sign = etcGmtOffset >= 0 ? "+" : "-";
  return `Etc/GMT${sign}${Math.abs(etcGmtOffset)}`;
}

async function fetchTimezoneByCoordinates(lat: number, lng: number) {
  const timeZoneResponse = await fetch(
    `https://timeapi.io/api/TimeZone/coordinate?latitude=${lat}&longitude=${lng}`,
    {
      headers: { Accept: "application/json" },
    },
  );

  if (!timeZoneResponse.ok) {
    return null;
  }

  const timeZoneData = (await timeZoneResponse.json()) as {
    timeZone?: string;
    currentUtcOffset?: { seconds?: number };
  };

  return timeZoneData.timeZone ?? null;
}

function normalizeLocationLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

interface UseLocationSearchOptions {
  initialQuery?: string;
  initialLocation?: LocationData | null;
}

export function useLocationSearch(options?: UseLocationSearchOptions) {
  const [placeQuery, setPlaceQuery] = useState(options?.initialQuery ?? "");
  const [locationResults, setLocationResults] = useState<LocationData[]>([]);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(options?.initialLocation ?? null);

  useEffect(() => {
    if (!selectedLocation || placeQuery === selectedLocation.displayName) {
      return;
    }

    const clearSelectionTimer = window.setTimeout(() => {
      setSelectedLocation(null);
    }, 0);

    return () => {
      window.clearTimeout(clearSelectionTimer);
    };
  }, [placeQuery, selectedLocation]);

  useEffect(() => {
    const query = placeQuery.trim();

    if (query.length < 2) {
      const resetTimer = window.setTimeout(() => {
        setLocationResults([]);
        setLocationOpen(false);
        setLocationLoading(false);
      }, 0);

      return () => {
        window.clearTimeout(resetTimer);
      };
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        setLocationLoading(true);

        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=20&accept-language=pt-BR&dedupe=1&q=${encodeURIComponent(query)}`,
          {
            headers: { Accept: "application/json" },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          setLocationResults([]);
          setLocationOpen(false);
          return;
        }

        const data = (await response.json()) as Array<{
          lat: string;
          lon: string;
          importance?: number;
          type?: string;
          addresstype?: string;
          address?: {
            city?: string;
            town?: string;
            village?: string;
            municipality?: string;
            county?: string;
            state_district?: string;
            state?: string;
            region?: string;
            province?: string;
            country?: string;
          };
        }>;

        const parsed = data
          .map((item) => {
            const city =
              item.address?.city ??
              item.address?.town ??
              item.address?.village ??
              item.address?.municipality ??
              item.address?.county ??
              "Local";
            const stateName = item.address?.state ?? item.address?.state_district ?? item.address?.province ?? item.address?.region ?? "Regiao";
            const country = item.address?.country ?? "Pais";
            const cleanDisplayName = `${city}, ${stateName}, ${country}`;

            return {
              city,
              state: stateName,
              country,
              lat: Number(item.lat),
              lng: Number(item.lon),
              timezone: null,
              displayName: cleanDisplayName,
              rank: item.importance ?? 0,
              type: item.type ?? "",
              addresstype: item.addresstype ?? "",
            } satisfies LocationData;
          })
          .filter((item) => Number.isFinite(item.lat) && Number.isFinite(item.lng))
          .filter((item) => item.displayName.length > 0)
          .filter((item) => {
            const type = item.type?.toLowerCase() ?? "";
            const addresstype = item.addresstype?.toLowerCase() ?? "";
            const allowed = [
              "city",
              "town",
              "village",
              "municipality",
              "county",
              "state",
              "administrative",
            ];

            return allowed.includes(type) || allowed.includes(addresstype);
          })
          .sort((a, b) => (b.rank ?? 0) - (a.rank ?? 0))
          .reduce<LocationData[]>((acc, item) => {
            const normalizedCurrent = normalizeLocationLabel(item.displayName);

            if (acc.some((existing) => normalizeLocationLabel(existing.displayName) === normalizedCurrent)) {
              return acc;
            }

            return [...acc, item];
          }, [])
          .slice(0, 12);

        setLocationResults(parsed);
        setLocationOpen(parsed.length > 0);
      } catch {
        setLocationResults([]);
        setLocationOpen(false);
      } finally {
        setLocationLoading(false);
      }
    }, 500);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [placeQuery]);

  async function handleSelectLocation(location: LocationData) {
    setPlaceQuery(location.displayName);
    setLocationOpen(false);

    const fallbackTimezone = getTimezoneFromCountry(location.country) ?? getTimezoneFromLongitude(location.lng);

    setSelectedLocation({
      ...location,
      timezone: fallbackTimezone,
    });

    let timezone: string | null = null;

    try {
      timezone = await fetchTimezoneByCoordinates(location.lat, location.lng);
    } catch {
      timezone = null;
    }

    if (!timezone) {
      timezone = fallbackTimezone;
    }

    const resolvedLocation = {
      ...location,
      timezone,
    };

    setSelectedLocation((current) => {
      if (!current || current.displayName !== location.displayName) {
        return current;
      }

      return resolvedLocation;
    });

    return resolvedLocation;
  }

  function hydrateLocation(location: LocationData) {
    setPlaceQuery(location.displayName);
    setSelectedLocation(location);
    setLocationOpen(false);
  }

  return {
    placeQuery,
    setPlaceQuery,
    locationResults,
    locationLoading,
    locationOpen,
    setLocationOpen,
    selectedLocation,
    handleSelectLocation,
    hydrateLocation,
  };
}
