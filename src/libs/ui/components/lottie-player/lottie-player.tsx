import type { AnimationItem } from 'lottie-web';
import React, { useEffect, useRef } from 'react';

interface LottiePlayerProps {
  src: object | string;
  loop?: boolean;
  autoplay?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export function LottiePlayer({
  src,
  loop,
  autoplay,
  style,
  className
}: LottiePlayerProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (container.current == null) {
      return;
    }

    let anim: AnimationItem | undefined;
    // Cleanup routinely runs before the chunk resolves, and without this flag destroy() never fires.
    let cancelled = false;

    // SVG-only light build: drops the eval/Function-based expressions engine, dead
    // under our `script-src 'self'` CSP. Loaded on mount to keep 165 KB out of every entry.
    import('lottie-web/build/player/lottie_light')
      .then(({ default: lottie }) => {
        if (cancelled || container.current == null) {
          return;
        }

        anim = lottie.loadAnimation({
          container: container.current,
          renderer: 'svg',
          loop: !!loop,
          autoplay: !!autoplay,
          // lottie-web mutates the animationData it is given, and these JSONs are shared.
          ...(typeof src === 'string'
            ? { path: src }
            : { animationData: structuredClone(src) })
        });
      })
      .catch(error => {
        // Only reachable when the packaged chunk is broken, which would otherwise look like a missing animation.
        console.error('Failed to load the lottie player', error);
      });

    return () => {
      cancelled = true;
      anim?.destroy();
    };
  }, [src, loop, autoplay]);

  return <div ref={container} className={className} style={style} />;
}
