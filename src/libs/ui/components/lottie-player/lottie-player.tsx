import lottie from 'lottie-web';
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

    const anim = lottie.loadAnimation({
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

    return () => anim.destroy();
  }, [src, loop, autoplay]);

  return <div ref={container} className={className} style={style} />;
}
