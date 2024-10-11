import React from 'react';
import { DotLottiePlayer } from '@dotlottie/react-player';

interface LoadingProps {
  width?: number;
  height?: number;
}

const Loading: React.FC<LoadingProps> = ({ width = 700, height = 700 }) => {
  return (
    <div className=" flex justify-center align-middle loading-container">
      <DotLottiePlayer
        src="/images/loading.lottie"
        autoplay
        loop
        style={{ width: `${width}px`, height: `${height}px` }}
      />
    </div>
  );
};

export default Loading;
