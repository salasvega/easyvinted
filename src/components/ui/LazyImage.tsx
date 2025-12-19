import React, { memo, useEffect, useMemo, useRef, useState } from "react";

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

// Cache session: si une URL est “Object not found”, on ne la redemande plus
const missingUrlCache = new Set<string>();

const LazyImageComponent = ({
  src,
  alt,
  className = "",
  fallback,
  onLoad,
  onError,
}: LazyImageProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const isKnownMissing = useMemo(() => missingUrlCache.has(src), [src]);

  const [shouldLoad, setShouldLoad] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(isKnownMissing);

  // Reset propre à chaque changement de src
  useEffect(() => {
    setHasError(missingUrlCache.has(src));
    setIsLoading(true);
    setShouldLoad(false);

    // si déjà connu manquant, inutile d'observer/charger
    if (missingUrlCache.has(src)) return;

    if (!containerRef.current) return;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setShouldLoad(true);
          observerRef.current?.disconnect();
        }
      },
      { rootMargin: "100px", threshold: 0.01 }
    );

    observerRef.current.observe(containerRef.current);

    return () => observerRef.current?.disconnect();
  }, [src]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    missingUrlCache.add(src);
    onError?.();
  };

  // Si manquante: on rend direct le fallback (zéro requête)
  if (hasError && fallback) {
    return <>{fallback}</>;
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {isLoading && <div className="absolute inset-0 bg-slate-100 animate-pulse" />}

      {shouldLoad && !hasError && (
        <img
          src={src}
          alt={alt}
          className={`${className} ${isLoading ? "opacity-0" : "opacity-100"} transition-opacity duration-300`}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
        />
      )}
    </div>
  );
};

export const LazyImage = memo(LazyImageComponent, (prev, next) => {
  // On compare src + className, ça suffit ici
  return prev.src === next.src && prev.className === next.className;
});
