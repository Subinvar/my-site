import Link from 'next/link';

import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from './card';

type NewsCardProps = {
  title: string;
  description?: string | null;
  date?: string | null;
  dateTime?: string | null;
  href: string;
  readMoreLabel: string;
};

export function NewsCard({ title, description, date, dateTime, href, readMoreLabel }: NewsCardProps) {
  return (
    <Card as="article" className="flex h-full flex-col">
      <CardHeader className="mb-0 space-y-2">
        {date ? (
          <time
            dateTime={dateTime ?? undefined}
            className="text-xs font-medium uppercase tracking-wide text-[var(--muted-foreground)]"
          >
            {date}
          </time>
        ) : null}
        <CardTitle className="text-xl leading-tight">{title}</CardTitle>
        {description ? <CardDescription className="mt-1 text-sm">{description}</CardDescription> : null}
      </CardHeader>

      <CardFooter className="mt-auto justify-start">
        <Link
          href={href}
          className="text-sm font-semibold text-[var(--color-brand-700)] transition hover:text-[var(--color-brand-600)]"
        >
          {readMoreLabel}
        </Link>
      </CardFooter>
    </Card>
  );
}
