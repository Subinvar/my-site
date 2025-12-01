'use client';

import { cloneElement, isValidElement } from 'react';
import type { ButtonHTMLAttributes, ReactNode, ReactElement } from 'react';

import { buttonClassNames, type ButtonSize, type ButtonVariant } from './button-classes';
import { cn } from '@/lib/cn';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  asChild?: boolean;
}

type SlotChildProps = {
  children?: ReactNode;
  className?: string;
} & Record<string, unknown>;

function isSlotChild(element: ReactNode): element is ReactElement<SlotChildProps> {
  return isValidElement(element);
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  leftIcon,
  rightIcon,
  asChild,
  className,
  children,
  ...rest
}: ButtonProps) {
  const slotChild = asChild && isSlotChild(children) ? children : null;

  const content = (
    <>
      {leftIcon ? <span className="inline-flex shrink-0">{leftIcon}</span> : null}
      <span className="truncate">
        {slotChild ? slotChild.props.children : children}
      </span>
      {rightIcon ? <span className="inline-flex shrink-0">{rightIcon}</span> : null}
    </>
  );

  if (slotChild) {
    const childProps = slotChild.props;
    return cloneElement(slotChild, {
      ...rest,
      ...childProps,
      className: cn(buttonClassNames({ variant, size, fullWidth, className }), childProps.className),
      children: content,
    });
  }

  return (
    <button
      className={buttonClassNames({ variant, size, fullWidth, className })}
      {...rest}
    >
      {content}
    </button>
  );
}
