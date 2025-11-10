import Image from "next/image";
import type { HTMLAttributes } from "react";

type FigureProps = {
  src: string;
  alt: string;
  caption?: string;
  title?: string;
  width?: number;
  height?: number;
  credit?: string;
} & HTMLAttributes<HTMLElement>;

export function Figure({ src, alt, caption, title, width, height, credit, ...rest }: FigureProps) {
  const captionId = caption ? `${alt.replace(/\s+/g, "-").toLowerCase()}-caption` : undefined;

  return (
    <figure className="figure my-8 space-y-4" aria-labelledby={captionId} {...rest}>
      <div className="overflow-hidden rounded-2xl border border-foreground/10 bg-foreground/5 shadow-sm">
        <Image
          src={src}
          alt={alt}
          width={width ?? 960}
          height={height ?? Math.round((width ?? 960) * 0.56)}
          title={title}
          className="h-auto w-full object-cover"
          sizes="(min-width: 768px) 768px, 100vw"
        />
      </div>
      {(caption || credit) && (
        <figcaption id={captionId} className="text-sm text-muted-foreground">
          {caption ? <p className="text-pretty leading-relaxed">{caption}</p> : null}
          {credit ? (
            <p className="mt-1 text-xs uppercase tracking-wide text-foreground/70">{credit}</p>
          ) : null}
        </figcaption>
      )}
    </figure>
  );
}