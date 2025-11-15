import { NextResponse } from 'next/server';

import { getInterfaceDictionary } from '@/content/dictionary';
import { defaultLocale, locales, type Locale } from '@/lib/i18n';

type LocalizedValues = Record<Locale, string>;

type Dictionaries = Record<Locale, ReturnType<typeof getInterfaceDictionary>>;

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildValues(
  dictionaries: Dictionaries,
  selector: (dictionary: ReturnType<typeof getInterfaceDictionary>, locale: Locale) => string
): LocalizedValues {
  const result: Partial<LocalizedValues> = {};
  for (const locale of locales) {
    result[locale] = selector(dictionaries[locale], locale);
  }
  return result as LocalizedValues;
}

function renderLocalizedText(values: LocalizedValues, indent: string): string {
  const fallback = values[defaultLocale] ?? '';
  const lines = [`${indent}<xsl:choose>`];
  for (const locale of locales) {
    const label = escapeXml(values[locale] ?? fallback);
    lines.push(
      `${indent}  <xsl:when test="$locale = '${locale}'"><xsl:text>${label}</xsl:text></xsl:when>`
    );
  }
  lines.push(
    `${indent}  <xsl:otherwise><xsl:text>${escapeXml(fallback)}</xsl:text></xsl:otherwise>`
  );
  lines.push(`${indent}</xsl:choose>`);
  return lines.join('\n');
}

function renderLocaleResolution(indent: string): string {
  const lines = [`${indent}<xsl:choose>`];
  for (const locale of locales) {
    lines.push(
      `${indent}  <xsl:when test="$detectedLocale = '${locale}'"><xsl:text>${locale}</xsl:text></xsl:when>`
    );
  }
  lines.push(
    `${indent}  <xsl:otherwise><xsl:text>${defaultLocale}</xsl:text></xsl:otherwise>`
  );
  lines.push(`${indent}</xsl:choose>`);
  return lines.join('\n');
}

export function GET() {
  const dictionaries: Dictionaries = Object.fromEntries(
    locales.map((locale) => [locale, getInterfaceDictionary(locale)])
  ) as Dictionaries;

  const pageTitles = buildValues(dictionaries, (dict) => dict.sitemap.pageTitle);
  const pageColumnLabels = buildValues(dictionaries, (dict) => dict.sitemap.columns.page);
  const alternatesColumnLabels = buildValues(
    dictionaries,
    (dict) => dict.sitemap.columns.alternates
  );
  const updatedColumnLabels = buildValues(dictionaries, (dict) => dict.sitemap.columns.updated);
  const emptyValueLabels = buildValues(dictionaries, (dict) => dict.common.emptyValue);

  const xsl = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
  version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  exclude-result-prefixes="xhtml sitemap"
>
  <xsl:output method="html" encoding="UTF-8" indent="yes" />
  <xsl:template match="/">
    <xsl:variable name="detectedLocale" select="/sitemap:urlset/@xml:lang" />
    <xsl:variable name="locale">
${renderLocaleResolution('      ')}
    </xsl:variable>
    <html>
      <xsl:attribute name="lang">
        <xsl:value-of select="$locale" />
      </xsl:attribute>
      <head>
        <meta charset="UTF-8" />
        <title>
${renderLocalizedText(pageTitles, '          ')}
        </title>
        <style>
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background-color: #f5f5f5;
            color: #111827;
            margin: 0;
            padding: 2rem;
          }

          h1 {
            font-size: 1.75rem;
            margin-bottom: 1.5rem;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            background-color: #ffffff;
            box-shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
            border-radius: 0.75rem;
            overflow: hidden;
          }

          thead {
            background-color: #111827;
            color: #ffffff;
          }

          th,
          td {
            padding: 0.85rem 1rem;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
            vertical-align: top;
          }

          tbody tr:nth-child(even) {
            background-color: #f9fafb;
          }

          a {
            color: #1d4ed8;
            text-decoration: none;
            word-break: break-all;
          }

          a:hover {
            text-decoration: underline;
          }

          .alt-list {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
            margin: 0;
            padding: 0;
            list-style: none;
          }

          .timestamp {
            white-space: nowrap;
          }
        </style>
      </head>
      <body>
        <h1>
${renderLocalizedText(pageTitles, '          ')}
        </h1>
        <table>
          <thead>
            <tr>
              <th scope="col">
${renderLocalizedText(pageColumnLabels, '                ')}
              </th>
              <th scope="col">
${renderLocalizedText(alternatesColumnLabels, '                ')}
              </th>
              <th scope="col">
${renderLocalizedText(updatedColumnLabels, '                ')}
              </th>
            </tr>
          </thead>
          <tbody>
            <xsl:for-each select="sitemap:urlset/sitemap:url">
              <tr>
                <td>
                  <a href="{sitemap:loc}">
                    <xsl:value-of select="sitemap:loc" />
                  </a>
                </td>
                <td>
                  <ul class="alt-list">
                    <xsl:for-each select="xhtml:link">
                      <li>
                        <strong>
                          <xsl:value-of select="@hreflang" />
                        </strong>
                        <span> — </span>
                        <a href="{@href}">
                          <xsl:value-of select="@href" />
                        </a>
                      </li>
                    </xsl:for-each>
                  </ul>
                </td>
                <td class="timestamp">
                  <xsl:choose>
                    <xsl:when test="sitemap:lastmod">
                      <xsl:value-of select="sitemap:lastmod" />
                    </xsl:when>
                    <xsl:otherwise>
${renderLocalizedText(emptyValueLabels, '                      ')}
                    </xsl:otherwise>
                  </xsl:choose>
                </td>
              </tr>
            </xsl:for-each>
          </tbody>
        </table>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>`;

  return new NextResponse(xsl, {
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
    },
  });
}
