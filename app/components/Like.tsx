import { DotLottieCommonPlayer, DotLottiePlayer } from '@dotlottie/react-player';
import React, { useEffect, useRef } from 'react';

interface LikeProps {
  userInfluenced: boolean;
}

const Like: React.FC<LikeProps> = ({ userInfluenced }) => {
  const playerRef = useRef<DotLottieCommonPlayer | null>(null);

  useEffect(() => {
    if (playerRef.current) {
setTimeout(() => {
  userInfluenced?playerRef.current?.playSegments([65, 67], true):playerRef.current?.playSegments([10, 0], true);
}, 70);
    }
  }, []);

  useEffect(() => {
    if (playerRef.current) {
      if (userInfluenced) {
        playerRef.current.playSegments([0, 67], true);
      } else {
        playerRef.current.playSegments([40,0], true);
      }
    }
  }, [userInfluenced]);

  return (
    <div className='w-10 h-10'>
      <DotLottiePlayer
        ref={playerRef}
        src={"images/like2.lottie"}
        autoplay={false}
        loop={false}
      />
    </div>
  );
}

export default Like;
