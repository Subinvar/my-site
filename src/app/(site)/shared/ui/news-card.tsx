import Image from 'next/image';
import Link from 'next/link';

import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from './card';

type NewsCardProps = {
  title: string;
  description?: string | null;
  date?: string | null;
  dateTime?: string | null;
  href: string;
  readMoreLabel: string;
  imageSrc?: string | null;
  imageAlt?: string | null;
};

export function NewsCard({
  title,
  description,
  date,
  dateTime,
  href,
  readMoreLabel,
  imageSrc,
  imageAlt,
}: NewsCardProps) {
  return (
    <Card as="article" className="flex h-full flex-col overflow-hidden">
      {imageSrc ? (
        <div className="relative aspect-[16/9] w-full">
          <Image
            src={imageSrc}
            alt={imageAlt ?? ''}
            fill
            className="object-cover"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
        </div>
      ) : null}

      <CardHeader className="flex-1 space-y-2">
        {date ? (
          <time
            dateTime={dateTime ?? undefined}
            className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
          >
            {date}
          </time>
        ) : null}
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? (
          <CardDescription className="mt-1 text-sm">{description}</CardDescription>
        ) : null}
      </CardHeader>

      <CardFooter className="mt-auto justify-start">
        <Link
          href={href}
          className="inline-flex items-center text-sm font-semibold text-[var(--color-brand-600)] underline-offset-4 transition-colors duration-150 hover:text-[var(--color-brand-700)] hover:underline"
        >
          {readMoreLabel}
          <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full border border-transparent text-xs transition-all duration-150 group-hover:translate-x-0.5 group-hover:border-[var(--color-brand-400)]">
            →
          </span>
        </Link>
      </CardFooter>
    </Card>
  );
}
