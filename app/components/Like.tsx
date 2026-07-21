"use client";

import { DotLottieCommonPlayer, DotLottiePlayer } from '@dotlottie/react-player';
import React, { useEffect, useRef, useState } from 'react';

interface LikeProps {
  userInfluenced: boolean;
}

const Like = ({ userInfluenced }: LikeProps) => {
  const playerRef = useRef<DotLottieCommonPlayer | null>(null);
  const [isFirstRender, setIsFirstRender] = useState(true);

  useEffect(() => {
    if (playerRef.current) {
      // 1. При първоначално зареждане
      if (isFirstRender) {
        // Даваме 100ms на браузъра да парсне Lottie анимацията, преди да я превъртим
        setTimeout(() => {
          if (userInfluenced) {
            playerRef.current?.playSegments([67, 67], true); // Заковаваме на пълно сърце
          } else {
            playerRef.current?.playSegments([0, 0], true); // Заковаваме на празно сърце
          }
          setIsFirstRender(false);
        }, 100); 
        return;
      }

      // 2. При кликане (Оптимистичен ъпдейт)
      // Тук файлът вече е зареден и нямаме нужда от никакво забавяне!
      if (userInfluenced) {
        playerRef.current.playSegments([0, 67], true); // Анимираме напълването
      } else {
        playerRef.current.playSegments([40, 0], true); // Анимираме изпразването
      }
    }
  }, [userInfluenced, isFirstRender]);

  return (
    <div className='w-10 h-10'>
      <DotLottiePlayer
        ref={playerRef}
        src={"/images/like2.lottie"}
        autoplay={false}
        loop={false}
      />
    </div>
  );
}

export default Like;