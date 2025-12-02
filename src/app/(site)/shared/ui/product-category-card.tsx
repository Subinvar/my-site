import type { ReactNode } from 'react';
import Link from 'next/link';

import { Button } from './button';
import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from './card';

interface ProductCategoryCardProps {
  title: string;
  description: string;
  href: string;
  icon?: ReactNode;
  ctaLabel?: string;
}

export function ProductCategoryCard({
  title,
  description,
  href,
  icon,
  ctaLabel = 'Смотреть каталог',
}: ProductCategoryCardProps) {
  return (
    <Card as="article" className="h-full">
      <CardHeader>
        {icon ? (
          <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent text-[var(--primary)]">
            {icon}
          </div>
        ) : null}
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardFooter>
        <Button asChild variant="secondary" size="sm">
          <Link href={href}>{ctaLabel}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
