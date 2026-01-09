'use client';

import { useEffect, useMemo, useState } from 'react';
import { Clock, ExternalLink, MapPin } from 'lucide-react';

import { CopyButton } from '@/app/(site)/shared/ui/copy-button';
import { Button } from '@/app/(site)/shared/ui/button';
import { Card } from '@/app/(site)/shared/ui/card';
import { buttonClassNames } from '@/app/(site)/shared/ui/button-classes';
import { cn } from '@/lib/cn';
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
  yandexWidgetUrl: string | null;
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
  mapFallback: string;
};

function parseCoord(value: string | null): number | null {
  if (!value) return null;
  const normalized = value.replace(',', '.').trim();
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildYandexWidgetEmbedUrl(lat: number, lon: number, locale: Locale, zoom = 16) {
  const ll = `${lon.toFixed(6)},${lat.toFixed(6)}`;
  const pt = `${lon.toFixed(6)},${lat.toFixed(6)},pm2rdm`;
  const lang = locale === 'en' ? 'en_US' : 'ru_RU';

  // Note: Yandex doesn't guarantee a stable public URL scheme for the widget.
  // However, this format is widely used and works well without an API key.
  return `https://yandex.ru/map-widget/v1/?ll=${encodeURIComponent(ll)}&z=${zoom}&pt=${encodeURIComponent(pt)}&lang=${encodeURIComponent(lang)}`;
}

function buildGoogleMapsUrl(lat: number, lon: number) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${lat.toFixed(6)},${lon.toFixed(6)}`)}`;
}

function buildYandexMapsUrl(lat: number, lon: number, zoom = 16) {
  const ll = `${lon.toFixed(6)},${lat.toFixed(6)}`;
  const pt = `${lon.toFixed(6)},${lat.toFixed(6)}`;
  return `https://yandex.ru/maps/?ll=${encodeURIComponent(ll)}&z=${zoom}&pt=${encodeURIComponent(pt)}`;
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
  const hasDescription = copy.description.trim().length > 0;
  const copyButtonClasses = 'w-full sm:w-[170px]';
  const mapButtonClasses = 'w-full sm:w-[140px]';
  const ctaActionClasses = 'text-[var(--header-border)] hover:text-foreground';
  const ctaSurfaceClasses = 'bg-background/45 hover:bg-background/60';
  const staticButtonClasses = 'transition-none shadow-none active:translate-y-0';
  const hasHeader = copy.title.trim().length > 0 || copy.description.trim().length > 0;

  const orderedLocations = useMemo(() => {
    const list = [...locations];
    // Always show the primary location first ("Склад / производство" by default)
    // to keep the UI stable regardless of CMS ordering.
    list.sort((a, b) => {
      if (a.isPrimary !== b.isPrimary) return a.isPrimary ? -1 : 1;
      return a.title.localeCompare(b.title, locale === 'ru' ? 'ru' : 'en');
    });
    return list;
  }, [locations, locale]);

  const initialLocationId = useMemo(() => {
    const primary = orderedLocations.find((location) => location.isPrimary) ?? orderedLocations[0];
    return primary?.id ?? '';
  }, [orderedLocations]);

  const [selectedId, setSelectedId] = useState(initialLocationId);

  const selectedLocation = useMemo(() => {
    return orderedLocations.find((location) => location.id === selectedId) ?? orderedLocations[0] ?? null;
  }, [orderedLocations, selectedId]);

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
    const yandexWidget = selectedLocation?.yandexWidgetUrl?.trim() || (lat && lon ? buildYandexWidgetEmbedUrl(lat, lon, locale) : null);
    return { google, yandex, yandexWidget };
  }, [coords.lat, coords.lon, selectedLocation, locale]);

  const [isMapLoaded, setIsMapLoaded] = useState(false);

  useEffect(() => {
    // Reset the "loaded" state when switching locations.
    setIsMapLoaded(false);
  }, [selectedLocation?.id, urls.yandexWidget]);

  if (!locations.length) {
    return null;
  }

  return (
    <Card
      as="section"
      aria-label={copy.title || copy.addressLabel}
      className="flex min-h-0 flex-1 flex-col space-y-4 bg-muted"
    >
      {hasHeader ? (
        <header className="space-y-1">
          {copy.title ? <h2 className="text-lg font-semibold text-foreground">{copy.title}</h2> : null}
          {hasDescription ? <p className="text-sm text-muted-foreground">{copy.description}</p> : null}
        </header>
      ) : null}

      {locations.length > 1 ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {orderedLocations.map((location) => {
            const active = location.id === selectedLocation?.id;
            return (
              <button
                key={location.id}
                type="button"
                onClick={() => setSelectedId(location.id)}
                className={buttonClassNames({
                  variant: 'cta',
                  size: 'md',
                  fullWidth: true,
                  className: cn(
                    // Allow multi-line content (override fixed height / centered layout).
                    'h-auto cursor-pointer flex-col items-start justify-start px-3 py-2 text-left',
                    'active:!translate-y-0',
                    ctaActionClasses,
                    ctaSurfaceClasses,
                    staticButtonClasses,
                    active && 'text-foreground after:border-[var(--color-brand-600)]',
                  ),
                })}
                aria-pressed={active}
              >
                <div className={cn('font-semibold', active ? 'text-foreground' : 'text-muted-foreground')}>
                  {location.title || location.id}
                </div>
                <div
                  className={cn(
                    'mt-1 line-clamp-1 text-sm',
                    active ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {location.address}
                </div>
              </button>
            );
          })}
        </div>
      ) : null}

      <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/30">
        {urls.yandexWidget ? (
          <>
            <div
              className={cn(
                'absolute inset-0 z-0 flex items-center justify-center px-6 text-center text-sm text-muted-foreground transition-opacity duration-200',
                isMapLoaded ? 'pointer-events-none opacity-0' : 'opacity-100',
              )}
            >
              {copy.mapFallback}
            </div>

            <iframe
              key={selectedLocation?.id}
              src={urls.yandexWidget}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="relative z-10 h-72 w-full border-0"
              title={copy.title}
              allowFullScreen
              onLoad={() => setIsMapLoaded(true)}
              data-map-embed="1"
            />
          </>
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
              <MapPin aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
              <div className="space-y-1">
                <div className="text-sm font-semibold text-foreground">{copy.addressLabel}</div>
                <div className="whitespace-pre-line text-base text-foreground">{selectedLocation.address}</div>
              </div>
            </div>

            {selectedLocation.hours ? (
              <div className="flex items-start gap-3">
                <Clock aria-hidden className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-foreground">{copy.hoursLabel}</div>
                  <div className="whitespace-pre-line text-sm text-foreground">{selectedLocation.hours}</div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <CopyButton
              text={selectedLocation.address}
              label={copy.copyAddress}
              copiedLabel={copy.copied}
              variant="cta"
              size="sm"
              className={cn(copyButtonClasses, 'cursor-pointer', ctaActionClasses, ctaSurfaceClasses, staticButtonClasses)}
            />

            {urls.yandex ? (
              <Button
                asChild
                variant="cta"
                size="sm"
                leftIcon={<ExternalLink aria-hidden className="h-4 w-4" />}
                className={cn(mapButtonClasses, ctaActionClasses, ctaSurfaceClasses, staticButtonClasses)}
              >
                <a href={urls.yandex} target="_blank" rel="noreferrer">
                  {copy.openYandex}
                </a>
              </Button>
            ) : null}

            {urls.google ? (
              <Button
                asChild
                variant="cta"
                size="sm"
                leftIcon={<ExternalLink aria-hidden className="h-4 w-4" />}
                className={cn(mapButtonClasses, ctaActionClasses, ctaSurfaceClasses, staticButtonClasses)}
              >
                <a href={urls.google} target="_blank" rel="noreferrer">
                  {copy.openGoogle}
                </a>
              </Button>
            ) : null}
          </div>

          {/* Small hint for locales that have different map ecosystems */}
          {locale === 'en' && urls.google && !selectedLocation.googleMapsUrl ? (
            <p className="text-xs text-muted-foreground">
              Tip: Google Maps link is generated automatically from coordinates.
            </p>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}