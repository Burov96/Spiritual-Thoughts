"use client";
import { DotLottiePlayer } from "@dotlottie/react-player";
import { useCallback, useEffect, useState } from "react";
import { NotificationProps, NotificationType } from "../notificationTypes";

const Notification:React.FC<NotificationProps> = ({ message, type, id}) => {
  const [fade, setFade] = useState(Boolean);
  const [opened, setOpened] = useState(Boolean);

  const handleClose = useCallback(() => {
    setFade(false);
    setOpened(false);
    setTimeout(() => {
    }, 300);
  }, []);

  useEffect(() => {
    const preTimeout = setTimeout(() => {
      setFade(true);
      setOpened(true);
    }, 20);

    const fadeTimeout = setTimeout(() => {
      setFade(false);
    }, 2700);

    const closeTimeout = setTimeout(() => {
      handleClose();
    }, 3000);

    console.log(id)
    return () => {
      clearTimeout(preTimeout);
      clearTimeout(fadeTimeout);
      clearTimeout(closeTimeout);
    };
  }, [id, handleClose]);


  return (
    message && (
      <div
        className={`z-[999] fixed top-10 md:top-32 right-1 w-60 md:w-80 h-16 md:h-24 bg-white p-4 rounded-lg shadow-md flex items-center justify-between hover:shadow-2xl transition-all duration-1000  opacity-0 md:scale-100 sm:scale-75`}
        style={{
          opacity: opened ? 1 : 0,
          transform: `translateX(${fade ? -40 : opened ? -10 : 100}px)`,
          top: `${10 + id*7}rem`,
        }}
      >
        <div className="w-20 h-20 flex items-center justify-center rounded-full">
            {type === "success" ? (
              <DotLottiePlayer src={"/images/success.lottie"} autoplay={true} />
            ) : type === "failure" ? (
              <DotLottiePlayer src={"/images/failure.lottie"} autoplay={true} />
            ) : type === "goodbye" ? (
              <DotLottiePlayer src={"/images/goodbye.lottie"} autoplay={true} />
            ) : type === "removed" ? (
              <DotLottiePlayer
                src={"/images/removed.lottie"}
                autoplay={true}
                direction={-1}
              />
            ) : type === "favourite" ? (
              <DotLottiePlayer
                src={"/images/favourite.lottie"}
                autoplay={true}
              />
            ) : type === "delete" ? (
              <DotLottiePlayer src={"/images/delete.lottie"} autoplay={true} />
            ) : type === "uploaded" ? (
              <DotLottiePlayer
                src={"/images/uploaded.lottie"}
                autoplay={true}
              />
            ) : (
              <DotLottiePlayer src={"/warning.lottie"} autoplay={true} />
            )
            }
        </div>
        <div className="text-gray-800 text-sm md:text-xl py-2">{message}</div>
        <button
          onClick={handleClose}
          className="text-gray-500 hover:text-gray-800 focus:outline-none"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1.414-9.293a1 1 0 0 1 1.414-1.414L10 8.586l1.414-1.414a1 1 0 0 1 1.414 1.414L11.414 10l1.414 1.414a1 1 0 0 1-1.414 1.414L10 11.414l-1.414 1.414a1 1 0 1 1 1.414 1.414L11.414 10l1.414 1.414a1 1 0 0 1-1.414 1.414L10 11.414l-1.414 1.414a1 1 0 0 1-1.414-1.414L8.586 10 7.172 8.586a1 1 0 0 1 1.414-1.414L10 8.586l1.414-1.414a1 1 0 0 1 1.414 1.414L11.414 10l1.414 1.414a1 1 0 0 1-1.414 1.414L10 11.414l-1.414 1.414a1 1 0 0 1-1.414-1.414L8.586 10 7.172 8.586a1 1 0 0 1 1.414-1.414L10 8.586l1.414-1.414a1 1 0 0 1 1.414 1.414L11.414 10l1.414 1.414a1 1 0 0 1-1.414 1.414L10 11.414l-1.414 1.414a1 1 0 0 1-1.414-1.414L8.586 10 7.172 8.586a1 1 0 0 1 0-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    )
  );
};


export {  Notification };
