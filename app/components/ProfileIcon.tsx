"use client"
import {
  DotLottiePlayer,
} from "@dotlottie/react-player";

const ProfileIcon: React.FC = () => {


  return (
    <div className="relative w-8 h-8 m-1">
      <DotLottiePlayer
        src={"/images/profile.lottie"}
        autoplay={true}
        loop={true}
      />
    </div>
  );
};

export default ProfileIcon;
