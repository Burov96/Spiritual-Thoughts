"use client";

import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { DotLottiePlayer } from '@dotlottie/react-player';

const WelcomePage = () => {
  const { colors } = useTheme();
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
