import Link from 'next/link';
import { localizePath, type Locale } from '@/lib/i18n';
import type { UiDictionary } from '@/lib/keystatic';

type FooterProps = {
  locale: Locale;
  links: { label: string; slug: string }[];
  contacts?: { address?: string; phone?: string };
  email?: string;
  dictionary: Pick<UiDictionary, 'footer'>;
};

export function SiteFooter({ locale, links, contacts, email, dictionary }: FooterProps) {
  const footer = dictionary.footer;
  const currentYear = new Date().getFullYear().toString();
  const copyright = footer.copyright.replace('{year}', currentYear);

  return (
    <footer className="mt-12 border-t border-zinc-200 bg-white">
      <div className="mx-auto grid max-w-5xl gap-6 px-4 py-8 sm:grid-cols-2 sm:px-6">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">{footer.navigationTitle}</h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600" aria-label={footer.navigationTitle}>
            {links.map((link) => (
              <li key={`${locale}-${link.slug}`}>
                <Link href={localizePath(locale, link.slug)} className="transition-colors hover:text-zinc-900">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">{footer.contactsTitle}</h2>
          <address className="mt-3 space-y-2 text-sm not-italic text-zinc-600">
            {contacts?.address ? <p>{contacts.address}</p> : null}
            {contacts?.phone ? <p>{contacts.phone}</p> : null}
            {email ? (
              <p>
                <a href={`mailto:${email}`} className="transition-colors hover:text-zinc-900">
                  {email}
                </a>
              </p>
            ) : null}
          </address>
        </div>
      </div>
      <div className="border-t border-zinc-200 py-4 text-center text-xs text-zinc-500">
        {copyright}
      </div>
    </footer>
  );
}