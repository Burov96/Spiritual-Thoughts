"use client"

import {
  DotLottieCommonPlayer,
  DotLottiePlayer,
} from "@dotlottie/react-player";
import React, { useRef } from "react";

const Thrash: React.FC = () => {
  const playerRef = useRef<DotLottieCommonPlayer | null>(null);

  const handleMouseEnter = () => {
    if (playerRef.current) {
      console.log("hovered");
      playerRef.current.setSpeed(3);
        playerRef.current.playSegments([10, 11], false);
    }
  };


  return (
    <div className="w-9 h-9">
      <DotLottiePlayer
        ref={playerRef}
        src={"/images/thrash.lottie"}
        autoplay={false}
        loop={false}
        onMouseEnter={handleMouseEnter}
      />
    </div>
  );
};

export default Thrash;
