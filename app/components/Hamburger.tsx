import { DotLottieCommonPlayer, DotLottiePlayer } from '@dotlottie/react-player';
import React, { useEffect, useRef } from 'react';

interface HamburgerProps {
  open: boolean;
}

const Hamburger = ({ open }: HamburgerProps): JSX.Element => {
  const playerRef = useRef<DotLottieCommonPlayer | null>(null);

  useEffect(() => {
    if (open) {
      playerRef.current?.playSegments([30, 60], true);
    } else {
      playerRef.current?.playSegments([40, 20], true);
    }
  }, [open]);

  return (
    <div className='w-20'>
      <DotLottiePlayer
        ref={playerRef}
        src="images/hamburger.lottie"
        autoplay={false}
        loop={false}
      />
    </div>
  );
}

export default Hamburger;
