"use client"

import {
  DotLottieCommonPlayer,
  DotLottiePlayer,
} from "@dotlottie/react-player";
import React, { useRef } from "react";

const Thrash: React.FC = () => {
  const playerRef = useRef<DotLottieCommonPlayer | null>(null);




  return (
    <div className="w-9 h-9">
      <DotLottiePlayer
        ref={playerRef}
        src={"/images/thrash.lottie"}
        autoplay={true}
        loop={true}
      />
    </div>
  );
};

export default Thrash;
