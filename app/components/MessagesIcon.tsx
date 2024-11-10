"use client"
import {
  DotLottiePlayer,
} from "@dotlottie/react-player";

const MessagesIcon: React.FC = () => {


  return (
    <div className="relative w-8 h-8 m-1">
      <DotLottiePlayer
        src={"/images/feed.lottie"}
        autoplay={true}
        loop={true}
      />
    </div>
  );
};

export default MessagesIcon;
