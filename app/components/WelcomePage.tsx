"use client";

import React from 'react';
import { DotLottiePlayer } from '@dotlottie/react-player';


const WelcomePage = () => {
  return (
    <div className="mr-24 flex justify-center align-middle  text-slate-900 ">
      <DotLottiePlayer
        src="/images/socials.lottie"
        autoplay
        loop
        style={{ width: 700, height: 700 }}
      />
    </div>
  );
};

export {WelcomePage};
