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
    // The unlock spinner unmounts the moment unlock succeeds, so it routinely
    // loses the race with the chunk fetch. Without this flag loadAnimation runs
    // against a detached container and `anim` lands in a closure whose cleanup
    // already ran — destroy() never fires and the rAF loop leaks.
    //
    // No test covers it: the repo has no React rendering harness. Change by
    // reading, not by leaning on the suite.
    let cancelled = false;

    // SVG-only light build: drops the canvas/html renderers and the eval/Function-based
    // expressions engine (dead under our `script-src 'self'` CSP), shrinking the bundle.
    // Our animations only ever use `renderer: 'svg'` and no expressions.
    //
    // Loaded on mount rather than imported: at 165 KB parsed the player was the second
    // largest thing in every entry, and nothing an app renders on open uses it — the
    // unlock animation only appears once the user has submitted the password, the rest
    // are Ledger states (WALLET-1381). The container div renders either way, so the
    // layout is settled before the animation arrives.
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
          // lottie-web mutates the animationData it is given, so a shared imported
          // JSON (the dots/spinner animations are reused across several components)
          // would be corrupted after the first instance — pass a fresh clone.
          ...(typeof src === 'string'
            ? { path: src }
            : { animationData: structuredClone(src) })
        });
      })
      .catch(error => {
        // The chunk is served from the extension package, so this only fires if the
        // build is broken. Leave the empty container in place and say so — silently
        // swallowing it would turn a packaging bug into an invisible missing animation.
        console.error('Failed to load the lottie player', error);
      });

    return () => {
      cancelled = true;
      anim?.destroy();
    };
  }, [src, loop, autoplay]);

  return <div ref={container} className={className} style={style} />;
}
