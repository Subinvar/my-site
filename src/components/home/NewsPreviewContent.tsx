"use client";

import Link from 'next/link';

import { cn } from '@/lib/cn';
import { useInView } from '@/lib/use-in-view';
import type { Locale } from '@/lib/i18n';
import type { PostPreview } from './NewsPreview';

export type NewsPreviewContentProps = {
  locale: Locale;
  title: string;
  description: string;
  viewAllLabel: string;
  viewPostLabel: string;
  viewAllHref: string;
  posts: PostPreview[];
};

export function NewsPreviewContent({
  locale,
  title,
  description,
  viewAllLabel,
  viewPostLabel,
  viewAllHref,
  posts,
}: NewsPreviewContentProps) {
  const { ref, inView } = useInView({ rootMargin: '-20% 0px' });

  return (
    <section
      ref={ref}
      className={cn('py-16 lg:py-20', 'motion-fade-in-up')}
      data-in-view={inView ? 'true' : 'false'}
    >
      <div className="container mx-auto px-4">
        <header className="mb-8 flex items-end justify-between gap-4">
          <div className="space-y-2 motion-fade-in-up" data-in-view={inView ? 'true' : 'false'}>
            <h2 className="text-2xl font-semibold">{title}</h2>
            <p className="text-muted-foreground">{description}</p>
          </div>
          <Link
            href={viewAllHref}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline motion-fade-in-up"
            data-in-view={inView ? 'true' : 'false'}
          >
            {viewAllLabel}
          </Link>
        </header>

        <div className="space-y-4">
          {posts.map((post) => {
            const formattedDate = (() => {
              if (!post.date) return null;
              const parsed = new Date(post.date);
              if (Number.isNaN(parsed.getTime())) return post.date;
              return new Intl.DateTimeFormat(locale === 'ru' ? 'ru-RU' : 'en-US', {
                dateStyle: 'medium',
              }).format(parsed);
            })();

            return (
              <article
                key={post.id}
                className="card flex flex-col gap-2 transition-shadow duration-200 motion-fade-in-up sm:flex-row sm:items-center sm:justify-between hover:shadow-md"
                data-in-view={inView ? 'true' : 'false'}
              >
                <div>
                  {formattedDate ? (
                    <div className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                      {formattedDate}
                    </div>
                  ) : null}
                  <Link href={post.href} className="text-base font-medium hover:text-primary">
                    {post.title}
                  </Link>
                  {post.excerpt ? (
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{post.excerpt}</p>
                  ) : null}
                </div>
                <Link href={post.href} className="text-sm font-medium text-primary underline-offset-4 hover:underline">
                  {viewPostLabel}
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
