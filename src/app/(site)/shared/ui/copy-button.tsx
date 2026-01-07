'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Copy, Check } from 'lucide-react';

import { cn } from '@/lib/cn';

import { Button, type ButtonProps } from './button';

type CopyButtonProps = {
  text: string;
  label: string;
  copiedLabel?: string;
  timeoutMs?: number;
  iconOnly?: boolean;
} & Omit<ButtonProps, 'onClick' | 'children' | 'type'>;

async function fallbackCopy(text: string) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
  }
}

export function CopyButton({
  text,
  label,
  copiedLabel,
  timeoutMs = 2200,
  iconOnly,
  variant = 'secondary',
  size = 'sm',
  ...rest
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleClick = useCallback(async () => {
    if (!text) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        await fallbackCopy(text);
      }
      setCopied(true);
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => setCopied(false), timeoutMs);
    } catch {
      // no-op (quiet failure)
    }
  }, [text, timeoutMs]);

  const successLabel = copiedLabel ?? label;
  const currentLabel = copied ? successLabel : label;
  const icon = copied ? <Check aria-hidden className="h-4 w-4" /> : <Copy aria-hidden className="h-4 w-4" />;

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      aria-label={iconOnly ? currentLabel : undefined}
      leftIcon={iconOnly ? undefined : icon}
      {...rest}
    >
      {iconOnly ? (
        icon
      ) : (
        // Keep pill width stable when label changes (avoid layout shift).
        <span className="inline-grid">
          <span
            className={cn(
              'col-start-1 row-start-1 transition-opacity duration-150',
              copied ? 'opacity-0' : 'opacity-100'
            )}
            aria-hidden={copied}
          >
            {label}
          </span>
          <span
            className={cn(
              'col-start-1 row-start-1 transition-opacity duration-150',
              copied ? 'opacity-100' : 'opacity-0'
            )}
            aria-hidden={!copied}
          >
            {successLabel}
          </span>
        </span>
      )}
    </Button>
  );
}
