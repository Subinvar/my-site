<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet
  version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
  xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
  exclude-result-prefixes="xhtml sitemap"
>
  <xsl:output method="html" encoding="UTF-8" indent="yes" />
  <xsl:template match="/">
    <html lang="ru">
      <head>
        <meta charset="UTF-8" />
        <title>Карта сайта</title>
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
        <h1>Карта сайта</h1>
        <table>
          <thead>
            <tr>
              <th scope="col">Страница</th>
              <th scope="col">Альтернативные языки</th>
              <th scope="col">Обновлено</th>
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
                    <xsl:otherwise>—</xsl:otherwise>
                  </xsl:choose>
                </td>
              </tr>
            </xsl:for-each>
          </tbody>
        </table>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>