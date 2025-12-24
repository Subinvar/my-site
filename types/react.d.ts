import 'react';

declare module 'react' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- сохранить совместимость с generic сигнатурой HTMLAttributes
  interface HTMLAttributes<T> {
    /**
     * Native HTML inert attribute to remove element from focus/navigation order.
     * Accepts boolean or empty string to match DOM boolean attribute usage.
     */
    inert?: boolean | '';
  }
}