'use client';

import { useMemo, useState } from 'react';
import { Clock, ExternalLink, MapPin } from 'lucide-react';

import { CopyButton } from '@/app/(site)/shared/ui/copy-button';
import { Button } from '@/app/(site)/shared/ui/button';
import { cn } from '@/lib/cn';
import { focusRingBase } from '@/lib/focus-ring';
import type { Locale } from '@/lib/i18n';

type ContactsLocation = {
  id: string;
  title: string;
  address: string;
  hours: string | null;
  latitude: string | null;
  longitude: string | null;
  googleMapsUrl: string | null;
  yandexMapsUrl: string | null;
  isPrimary: boolean;
};

type ContactsLocationsCopy = {
  title: string;
  description: string;
  addressLabel: string;
  hoursLabel: string;
  copyAddress: string;
  copied: string;
  openGoogle: string;
  openYandex: string;
  openOsm: string;
  mapFallback: string;
};

function parseCoord(value: string | null): number | null {
  if (!value) return null;
  const normalized = value.replace(',', '.').trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildOsmEmbedUrl(lat: number, lon: number, delta = 0.01) {
  const minLon = lon - delta;
  const maxLon = lon + delta;
  const minLat = lat - delta;
  const maxLat = lat + delta;
  const bbox = `${minLon.toFixed(6)},${minLat.toFixed(6)},${maxLon.toFixed(6)},${maxLat.toFixed(6)}`;
  const marker = `${lat.toFixed(6)},${lon.toFixed(6)}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${encodeURIComponent(marker)}`;
}

function buildOsmViewUrl(lat: number, lon: number, zoom = 16) {
  return `https://www.openstreetmap.org/?mlat=${encodeURIComponent(lat.toFixed(6))}&mlon=${encodeURIComponent(lon.toFixed(6))}#map=${zoom}/${lat.toFixed(6)}/${lon.toFixed(6)}`;
}

function buildGoogleMapsUrl(lat: number, lon: number) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat.toFixed(6)},${lon.toFixed(6)}`)}`;
}

function buildYandexMapsUrl(lat: number, lon: number, zoom = 16) {
  return `https://yandex.ru/maps/?ll=${encodeURIComponent(`${lon.toFixed(6)},${lat.toFixed(6)}`)}&z=${zoom}`;
}

export function ContactsLocations({
  locale,
  locations,
  copy,
}: {
  locale: Locale;
  locations: ContactsLocation[];
  copy: ContactsLocationsCopy;
}) {
  const initialLocationId = useMemo(() => {
    const primary = locations.find((location) => location.isPrimary) ?? locations[0];
    return primary?.id ?? '';
  }, [locations]);

  const [selectedId, setSelectedId] = useState(initialLocationId);

  const selectedLocation = useMemo(() => {
    return locations.find((location) => location.id === selectedId) ?? locations[0] ?? null;
  }, [locations, selectedId]);

  const coords = useMemo(() => {
    if (!selectedLocation) return { lat: null, lon: null };
    const lat = parseCoord(selectedLocation.latitude);
    const lon = parseCoord(selectedLocation.longitude);
    return { lat, lon };
  }, [selectedLocation]);

  const urls = useMemo(() => {
    const lat = coords.lat;
    const lon = coords.lon;
    const google = selectedLocation?.googleMapsUrl?.trim() || (lat && lon ? buildGoogleMapsUrl(lat, lon) : null);
    const yandex = selectedLocation?.yandexMapsUrl?.trim() || (lat && lon ? buildYandexMapsUrl(lat, lon) : null);
    const osm = lat && lon ? buildOsmViewUrl(lat, lon) : null;
    const embed = lat && lon ? buildOsmEmbedUrl(lat, lon) : null;
    return { google, yandex, osm, embed };
  }, [coords.lat, coords.lon, selectedLocation]);

  if (!locations.length) {
    return null;
  }

  return (
    <section
      aria-label={copy.title}
      className="space-y-4 rounded-xl border border-border bg-background p-6 shadow-sm"
    >
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">{copy.title}</h2>
        <p className="text-sm text-muted-foreground">{copy.description}</p>
      </header>

      {locations.length > 1 ? (
        <div className="-mx-2 overflow-x-auto px-2 no-scrollbar">
          <div className="flex min-w-max gap-2">
            {locations.map((location) => {
              const active = location.id === selectedLocation?.id;
              return (
                <button
                  key={location.id}
                  type="button"
                  onClick={() => setSelectedId(location.id)}
                  className={cn(
                    'min-w-[220px] rounded-lg border px-3 py-2 text-left text-sm transition-colors',
                    'border-[var(--border)] bg-[var(--card)]',
                    'hover:border-[var(--color-brand-400)] hover:bg-[var(--muted)]',
                    focusRingBase,
                    active
                      ? 'border-[var(--color-brand-500)] bg-[var(--muted)] text-foreground'
                      : 'text-[var(--muted-foreground)]'
                  )}
                  aria-pressed={active}
                >
                  <div className="font-semibold text-foreground">{location.title || location.id}</div>
                  <div className="mt-1 line-clamp-2 text-xs text-[var(--muted-foreground)]">
                    {location.address}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-xl border border-border bg-muted/30 shadow-sm">
        {urls.embed ? (
          <iframe
            key={selectedLocation?.id}
            src={urls.embed}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="h-72 w-full border-0"
            title={copy.title}
          />
        ) : (
          <div className="flex h-72 items-center justify-center px-6 text-center text-sm text-muted-foreground">
            {copy.mapFallback}
          </div>
        )}
      </div>

      {selectedLocation ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <MapPin aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" strokeWidth={1.75} />
              <div className="space-y-1">
                <div className="text-sm font-semibold text-foreground">{copy.addressLabel}</div>
                <div className="whitespace-pre-line text-sm text-foreground">{selectedLocation.address}</div>
              </div>
            </div>

            {selectedLocation.hours ? (
              <div className="flex items-start gap-3">
                <Clock aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-brand-700" strokeWidth={1.75} />
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-foreground">{copy.hoursLabel}</div>
                  <div className="whitespace-pre-line text-sm text-foreground">{selectedLocation.hours}</div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <CopyButton
              text={[selectedLocation.title, selectedLocation.address].filter(Boolean).join('\n')}
              label={copy.copyAddress}
              copiedLabel={copy.copied}
            />

            {urls.google ? (
              <Button
                asChild
                variant="secondary"
                size="sm"
                leftIcon={<ExternalLink aria-hidden className="h-4 w-4" />}
              >
                <a href={urls.google} target="_blank" rel="noreferrer">
                  {copy.openGoogle}
                </a>
              </Button>
            ) : null}

            {urls.yandex ? (
              <Button
                asChild
                variant="secondary"
                size="sm"
                leftIcon={<ExternalLink aria-hidden className="h-4 w-4" />}
              >
                <a href={urls.yandex} target="_blank" rel="noreferrer">
                  {copy.openYandex}
                </a>
              </Button>
            ) : null}

            {urls.osm ? (
              <Button asChild variant="secondary" size="sm" leftIcon={<ExternalLink aria-hidden className="h-4 w-4" />}>
                <a href={urls.osm} target="_blank" rel="noreferrer">
                  {copy.openOsm}
                </a>
              </Button>
            ) : null}
          </div>

          {/* Small hint for locales that have different map ecosystems */}
          {locale === 'en' && urls.google && !selectedLocation.googleMapsUrl ? (
            <p className="text-xs text-muted-foreground">
              {/* eslint-disable-next-line react/no-unescaped-entities -- UX hint */}
              Tip: Google Maps link is generated automatically from coordinates.
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}