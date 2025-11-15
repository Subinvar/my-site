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

export function GET() {
  const dictionaries: Dictionaries = Object.fromEntries(
    locales.map((locale) => [locale, getInterfaceDictionary(locale)])
  ) as Dictionaries;

  const selfLabels = buildValues(dictionaries, (dict) => dict.feed.meta.selfLabel);
  const updatedLabels = buildValues(dictionaries, (dict) => dict.feed.meta.updatedLabel);
  const entryLabels = buildValues(dictionaries, (dict) => dict.feed.columns.entry);
  const publishedLabels = buildValues(dictionaries, (dict) => dict.feed.columns.published);
  const updatedColumnLabels = buildValues(dictionaries, (dict) => dict.feed.columns.updated);
  const emptyValueLabels = buildValues(dictionaries, (dict) => dict.common.emptyValue);

  const xsl = `<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
  version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:atom="http://www.w3.org/2005/Atom"
  exclude-result-prefixes="atom"
>
  <xsl:output method="html" encoding="UTF-8" indent="yes" />
  <xsl:template match="/">
    <xsl:variable name="locale" select="atom:feed/atom:category/@term" />
    <html lang="{$locale}">
      <head>
        <meta charset="UTF-8" />
        <title>
          <xsl:value-of select="atom:feed/atom:title" />
        </title>
        <style>
          body {
            font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background-color: #f5f5f5;
            color: #111827;
            margin: 0;
            padding: 2rem;
          }

          header {
            margin-bottom: 1.5rem;
          }

          h1 {
            font-size: 1.75rem;
            margin: 0 0 0.5rem 0;
          }

          .meta {
            color: #4b5563;
            margin: 0;
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
            word-break: break-word;
          }

          a:hover {
            text-decoration: underline;
          }

          .excerpt {
            color: #4b5563;
            margin: 0.5rem 0 0;
          }

          .content {
            margin: 0.75rem 0 0;
            color: #111827;
          }

          .content :first-child {
            margin-top: 0;
          }

          .timestamp {
            white-space: nowrap;
          }
        </style>
      </head>
      <body>
        <header>
          <h1>
            <xsl:value-of select="atom:feed/atom:title" />
          </h1>
          <p class="meta">
            <strong>
${renderLocalizedText(selfLabels, '              ')}
              <xsl:text>: </xsl:text>
            </strong>
            <a href="{atom:feed/atom:link[@rel='self']/@href}">
              <xsl:value-of select="atom:feed/atom:link[@rel='self']/@href" />
            </a>
            <br />
            <strong>
${renderLocalizedText(updatedLabels, '              ')}
              <xsl:text>: </xsl:text>
            </strong>
            <xsl:value-of select="atom:feed/atom:updated" />
          </p>
        </header>
        <table>
          <thead>
            <tr>
              <th scope="col">
${renderLocalizedText(entryLabels, '                ')}
              </th>
              <th scope="col">
${renderLocalizedText(publishedLabels, '                ')}
              </th>
              <th scope="col">
${renderLocalizedText(updatedColumnLabels, '                ')}
              </th>
            </tr>
          </thead>
          <tbody>
            <xsl:for-each select="atom:feed/atom:entry">
              <tr>
                <td>
                  <a href="{atom:link/@href}">
                    <xsl:value-of select="atom:title" />
                  </a>
                  <xsl:if test="atom:summary">
                    <p class="excerpt">
                      <xsl:value-of select="atom:summary" />
                    </p>
                  </xsl:if>
                  <xsl:if test="atom:content">
                    <div class="content">
                      <xsl:value-of select="atom:content" disable-output-escaping="yes" />
                    </div>
                  </xsl:if>
                </td>
                <td class="timestamp">
                  <xsl:choose>
                    <xsl:when test="atom:published">
                      <xsl:value-of select="atom:published" />
                    </xsl:when>
                    <xsl:otherwise>
${renderLocalizedText(emptyValueLabels, '                      ')}
                    </xsl:otherwise>
                  </xsl:choose>
                </td>
                <td class="timestamp">
                  <xsl:value-of select="atom:updated" />
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
