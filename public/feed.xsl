<?xml version="1.0" encoding="UTF-8"?>
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
            <strong>Self:</strong>
            <a href="{atom:feed/atom:link[@rel='self']/@href}">
              <xsl:value-of select="atom:feed/atom:link[@rel='self']/@href" />
            </a>
            <br />
            <strong>Обновлено:</strong>
            <xsl:value-of select="atom:feed/atom:updated" />
          </p>
        </header>
        <table>
          <thead>
            <tr>
              <th scope="col">Запись</th>
              <th scope="col">Опубликовано</th>
              <th scope="col">Обновлено</th>
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
                    <xsl:otherwise>—</xsl:otherwise>
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
</xsl:stylesheet>