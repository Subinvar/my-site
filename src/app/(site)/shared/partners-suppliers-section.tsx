import Image from 'next/image';
import Link from 'next/link';
import { type JSX } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

type Locale = 'ru' | 'en';

type Supplier = {
  id: string;
  name: Record<Locale, string>;
  subtitle: Record<Locale, string>;
  body: Record<Locale, string[]>;
  website: string;
  logoSrc: string;
};

const SUPPLIERS: Supplier[] = [
  {
    id: 'sq-group',
    name: {
      ru: 'Shengquan Group (SQ Group)',
      en: 'Shengquan Group (SQ Group)',
    },
    subtitle: {
      ru: 'Китайский технологический лидер в области фенольных и фурановых смол для литейной промышленности',
      en: 'Chinese technology leader in phenolic and furan resins for the foundry industry',
    },
    body: {
      ru: [
        'SQ Group — один из мировых лидеров по производству фенольных смол, фурановых связующих и вспомогательных литейных материалов. Их решения используются на литейных заводах по всему миру и задают отраслевые стандарты по стабильности качества и технологичности.',
        'Интема Групп представляет SQ Group в России: мы поставляем связующие системы, покрытия и вспомогательные материалы, подбираем рецептуры под конкретные процессы и сопровождаем запуск на производстве.',
      ],
      en: [
        'SQ Group is one of the global leaders in phenolic resins, furan binders and foundry auxiliaries, supplying foundries worldwide with high-performance materials.',
        'Intema Group is an SQ partner in Russia, supplying binder systems, coatings and auxiliaries and supporting customers with process tuning and on-site commissioning.',
      ],
    },
    website: 'https://e.shengquan.com/',
    logoSrc: '/uploads/partners/sq-group.svg',
  },
  {
    id: 'cavenaghi',
    name: {
      ru: 'Cavenaghi S.p.A.',
      en: 'Cavenaghi S.p.A.',
    },
    subtitle: {
      ru: 'Итальянский производитель литейных систем и промышленных смол с 1959 года',
      en: 'Italian producer of foundry systems and industrial resins since 1959',
    },
    body: {
      ru: [
        'Cavenaghi S.p.A. разрабатывает и выпускает системы связующих для литейных цехов, промышленные смолы, органические кислоты и гидротропы. Компания работает на итальянском и международном рынках, её продукты выступают отраслевым ориентиром по качеству и надёжности.',
        'Через Интема Групп российские литейные предприятия получают доступ к европейским технологиям Cavenaghi: системам No-Bake, Колд-Бокс, Hot-Box, неорганическим связующим и современным покрытиям для стержней и форм.',
      ],
      en: [
        'Cavenaghi S.p.A. develops binder systems for foundries, industrial resins, organic acids and hydrotropes, operating on Italian and international markets since 1959.',
        'Through Intema Group, Russian foundries can access Cavenaghi technologies: No-Bake, Cold-Box and Hot-Box systems, inorganic binders and advanced coatings for cores and moulds.',
      ],
    },
    website: 'https://www.cavenaghi.eu/en/',
    logoSrc: '/uploads/partners/cavenaghi.svg',
  },
];

export function PartnersSuppliersSection({ locale }: { locale: Locale }): JSX.Element {
  const title = locale === 'ru' ? 'Наши ключевые поставщики' : 'Our key technology partners';
  const caption =
    locale === 'ru'
      ? 'Мы работаем напрямую с мировыми лидерами в области литейной химии и связующих систем.'
      : 'We cooperate directly with world-class leaders in foundry chemistry and binder systems.';

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="max-w-2xl text-sm text-muted-foreground">{caption}</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        {SUPPLIERS.map((supplier) => (
          <Card key={supplier.id} className="flex h-full flex-col">
            <CardHeader className="flex flex-row items-start gap-4">
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-muted">
                <Image
                  src={supplier.logoSrc}
                  alt={supplier.name[locale]}
                  width={64}
                  height={64}
                  className="h-16 w-16 object-contain"
                />
              </div>
              <div>
                <CardTitle className="text-base sm:text-lg">{supplier.name[locale]}</CardTitle>
                <CardDescription className="text-xs sm:text-sm">{supplier.subtitle[locale]}</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-3 text-sm text-muted-foreground">
              {supplier.body[locale].map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}

              <div className="mt-2">
                <Link
                  href={supplier.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {locale === 'ru' ? 'Сайт партнёра' : 'Partner website'}
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
