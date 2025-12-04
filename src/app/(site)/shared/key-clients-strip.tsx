import { JSX } from 'react';

type Locale = 'ru' | 'en';

type Variant = 'full' | 'compact';

type Client = {
  id: string;
  name: string;
  logoSrc: string;
};

const KEY_CLIENTS: Client[] = [
  { id: 'kamaz', name: 'КамАЗ', logoSrc: '/uploads/clients/kamaz.svg' },
  { id: 'uaz', name: 'УАЗ', logoSrc: '/uploads/clients/uaz.svg' },
  { id: 'lz-pzm', name: 'ЛЗ ПЗМ', logoSrc: '/uploads/clients/lz-pzm.svg' },
  { id: 'rusal', name: 'РУСАЛ', logoSrc: '/uploads/clients/rusal.svg' },
  { id: 'nornickel', name: 'Норникель', logoSrc: '/uploads/clients/nornickel.svg' },
  { id: 'tmh', name: 'Трансмашхолдинг', logoSrc: '/uploads/clients/tmh.svg' },
];

export function KeyClientsStrip({
  locale,
  variant = 'full',
}: {
  locale: Locale;
  variant?: Variant;
}): JSX.Element {
  const title =
    locale === 'ru'
      ? 'Крупные предприятия, работающие с нашими материалами'
      : 'Major industrial customers using our materials';

  const captionRu =
    'На площадках наших заказчиков и партнёров работают решения на базе материалов SQ Group и Cavenaghi, поставляемые Интема Групп.';
  const captionEn =
    'Foundries and plants of our customers and partners run solutions based on SQ Group and Cavenaghi materials supplied by Intema Group.';

  const caption = locale === 'ru' ? captionRu : captionEn;

  const sectionClass =
    variant === 'full'
      ? 'space-y-4'
      : 'space-y-2 border rounded-2xl border-border p-4 bg-muted/40';

  return (
    <section className={sectionClass}>
      <header className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {variant === 'full' ? (
          <p className="text-sm text-muted-foreground max-w-3xl">{caption}</p>
        ) : null}
      </header>

      <div
        className={
          variant === 'full'
            ? 'grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6'
            : 'flex flex-wrap gap-3 items-center'
        }
      >
        {KEY_CLIENTS.map((client) => (
          <div
            key={client.id}
            className="flex items-center justify-center rounded-xl bg-background border border-border/60 px-4 py-3 shadow-sm"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- Logos are served as static <img> assets for predictable sizing */}
            <img
              src={client.logoSrc}
              alt={client.name}
              className={
                variant === 'full'
                  ? 'max-h-10 max-w-full object-contain'
                  : 'max-h-8 max-w-[90px] object-contain'
              }
            />
          </div>
        ))}
      </div>
    </section>
  );
}
