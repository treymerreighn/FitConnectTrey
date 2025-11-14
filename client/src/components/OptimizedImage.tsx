import { useState, useCallback } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  loading?: 'eager' | 'lazy';
  onLoad?: () => void;
  onError?: () => void;
  /**
   * A tiny, low-quality base64 placeholder (LQIP). If provided and
   * placeholder is set to 'blur', this will be shown and blurred until
   * the full image finishes loading.
   */
  blurDataURL?: string;
  /**
   * Placeholder rendering mode. 'blur' shows the blurDataURL until the full
   * image is loaded. 'empty' shows the existing pulse fallback.
   */
  placeholder?: 'blur' | 'empty';
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  loading = 'lazy',
  onLoad,
  onError,
  blurDataURL,
  placeholder = 'empty'
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setError(true);
    onError?.();
  }, [onError]);

  // Generate optimized image URL
  const optimizedSrc = () => {
    if (!src) return '';

    // For production, implement CDN transformations
    if (process.env.NODE_ENV === 'production') {
      const params = new URLSearchParams();
      if (width) params.set('w', width.toString());
      if (height) params.set('h', height.toString());
      params.set('q', '80'); // Quality
      params.set('f', 'webp'); // Format

      return `${src}?${params.toString()}`;
    }

    return src;
  };

  if (error) {
    const style: React.CSSProperties = {};
    if (width) style.maxWidth = typeof width === 'number' ? `${width}px` : width;
    if (height) style.maxHeight = typeof height === 'number' ? `${height}px` : height;
    return (
      <div
        className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}
        style={style}
      >
        <span className="text-gray-500 text-sm">Failed to load</span>
      </div>
    );
  }

  // If a blurDataURL isn't provided, attempt to generate a tiny low-quality
  // placeholder URL by requesting a very small version of the same src. This
  // works for image hosts that support width/quality query params (many CDNs
  // and providers). If it doesn't apply, we'll fallback to the pulse.
  const generateTinyPlaceholder = () => {
    if (!src) return undefined;

    try {
      // If src already has query params, append; otherwise add new ones.
      const hasQuery = src.includes('?');
      const sep = hasQuery ? '&' : '?';
      return `${src}${sep}w=20&q=20&f=webp`;
    } catch (_e) {
      return undefined;
    }
  };

  const placeholderSrc = blurDataURL || generateTinyPlaceholder();
  const useBlur = placeholder === 'blur' && !!placeholderSrc;
  const style: React.CSSProperties = {};
  if (width) style.maxWidth = typeof width === 'number' ? `${width}px` : width;
  if (height) style.maxHeight = typeof height === 'number' ? `${height}px` : height;

  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      {/* Blur-up / LQIP placeholder */}
      {useBlur ? (
        <img
          src={placeholderSrc}
          alt={`${alt} placeholder`}
          aria-hidden
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-0' : 'opacity-100'}`}
          style={{ filter: 'blur(12px) scale(1.05)' }}
        />
      ) : (
        // fallback pulse while loading
        !loaded && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse" />
        )
      )}

      <img
        src={optimizedSrc()}
        alt={alt}
        width={width}
        height={height}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        className={`relative w-full h-auto object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}