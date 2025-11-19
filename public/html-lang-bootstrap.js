(function () {
  try {
    var doc = document.documentElement;
    var localesAttr = doc.getAttribute('data-locales') || '';
    var defaultLocale = doc.getAttribute('data-default-locale') || 'ru';
    var locales = localesAttr
      .split(',')
      .map(function (value) {
        return value.trim();
      })
      .filter(Boolean);
    if (!locales.length) {
      locales = [defaultLocale];
    }
    var normalize = function (value) {
      return value && locales.indexOf(value) !== -1 ? value : null;
    };
    var cookieMatch = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]+)/);
    var cookieLocale = cookieMatch ? decodeURIComponent(cookieMatch[1] || '') : null;
    var segments = (window.location.pathname || '').split('/').filter(Boolean);
    var pathLocale = segments.length ? segments[0] : null;
    var nextLocale = normalize(cookieLocale) || normalize(pathLocale) || defaultLocale;
    doc.setAttribute('lang', nextLocale);
  } catch (error) {
    console.error('html-lang-bootstrap failed', error);
  }
})();
