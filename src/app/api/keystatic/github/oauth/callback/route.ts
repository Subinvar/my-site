import { NextResponse } from 'next/server';

const parentOrigin = process.env.NEXT_PUBLIC_KEYSTATIC_GITHUB_REDIRECT ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

const template = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Keystatic GitHub OAuth</title>
  </head>
  <body>
    <script>
      (function () {
        try {
          const target = '${parentOrigin.replace(/'/g, "\\'")}';
          window.opener?.postMessage({ type: 'keystatic:github:oauth' }, target === 'origin' ? '*' : target);
        } catch (error) {
          console.error(error);
        } finally {
          window.close();
        }
      })();
    </script>
    <p>You can close this window.</p>
  </body>
</html>`;

export function GET() {
  return new NextResponse(template, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}