"use client";

import React from 'react';
import { DotLottiePlayer } from '@dotlottie/react-player';

interface LoadingProps {
  width?: number;
  height?: number;
}

const Loading = ({ width = 700, height = 700 }: LoadingProps) => {
  return (
    <div className="flex justify-center align-middle loading-container bg-slate-300 text-slate-900 dark:bg-slate-900 dark:text-slate-100">
      <DotLottiePlayer
        src="/images/loading.lottie"
        autoplay
        loop
        style={{ width: `${width}px`, height: `${height}px` }}
      />
    </div>
  );
};

export {Loading};
