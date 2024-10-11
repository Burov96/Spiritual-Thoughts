import { DotLottiePlayer } from "@dotlottie/react-player";
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";

export const LottieExample = () => {
  const [dotLottie, setDotLottie] = useState(null);
  const [status, setStatus] = useState("idle");
  const [currentFrame, setCurrentFrame] = useState(0);
  const [loop, setLoop] = useState(true);

  // Calculating total frames and progress
  const totalFrames = dotLottie?.isLoaded ? dotLottie.totalFrames : 0;
  const progress = dotLottie?.isLoaded ? (currentFrame / totalFrames) * 100 : 0;

  // Effect for handling dotLottie events
  useEffect(() => {
    // Event handlers
    const onFrameChange = (event) => setCurrentFrame(event.currentFrame);
    const onPlay = () => setStatus("playing");
    const onPause = () => setStatus("paused");
    const onStop = () => setStatus("stopped");
    const onComplete = () => setStatus("completed");

    // Registering event listeners
    if (dotLottie) {
      dotLottie.addEventListener("frame", onFrameChange);
      dotLottie.addEventListener("play", onPlay);
      dotLottie.addEventListener("pause", onPause);
      dotLottie.addEventListener("stop", onStop);
      dotLottie.addEventListener("complete", onComplete);
    }

    // Cleanup
    return () => {
      if (dotLottie) {
        dotLottie.removeEventListener("frame", onFrameChange);
        dotLottie.removeEventListener("play", onPlay);
        dotLottie.removeEventListener("pause", onPause);
        dotLottie.removeEventListener("stop", onStop);
        dotLottie.removeEventListener("complete", onComplete);
      }
    };
  }, [dotLottie]);

  // Play or pause animation
  const playOrPause = () => {
    status === "playing" ? dotLottie?.pause() : dotLottie?.play();
  };

  // Toggle loop state
  const toggleLoop = (event) => setLoop(event.target.checked);

  // Seek functionality
  const onSeek = (event) => {
    const newFrame = (event.target.value / 100) * totalFrames;
    dotLottie.setFrame(newFrame);
  };

  const onSeekStart = () => status === "playing" && dotLottie.pause();
  const onSeekEnd = () => status !== "playing" && dotLottie.play();

  return (
    <div className="container">
      <DotLottiePlayer
        dotLottieRefCallback={setDotLottie}
        src="https://lottie.host/63e43fb7-61be-486f-aef2-622b144f7fc1/2m8UGcP8KR.json"
        autoplay
        loop={loop}
        style={{ maxWidth: "600px" }}
      />
      <a href="https://lottiefiles.com/animations/hiding-lolo-eH80VLpL27" target="_blank">
        Lolo Sticker - Hiding Lolo
      </a>
      <div>
        <button onClick={playOrPause}>
          {status === "playing" ? "⏸️" : "▶️"}
        </button>
        <input
          type="range"
          min="0"
          max="100"
          step="0.01"
          value={progress}
          onChange={onSeek}
          onMouseDown={onSeekStart}
          onMouseUp={onSeekEnd}
        />
        <span>
          {Math.round(currentFrame)}/{totalFrames}
        </span>
        <input onChange={toggleLoop} checked={loop} type="checkbox" />
      </div>
    </div>
  );
};
