// app/components/Notification.tsx

"use client";

import React, { useEffect, useState, useCallback } from "react";
import { DotLottiePlayer } from "@dotlottie/react-player";
import { NotificationProps } from "../notificationTypes";
import Thrash from "./Thrash";
import styles from "./Notification.module.css";

const Notification: React.FC<NotificationProps> = ({
  message,
  type,
  id,
  onRemove,
  onHover,
  persistent = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleClose = useCallback(() => {
    onRemove(id);
  }, [id, onRemove]);

  const handleMouseEnter = useCallback(() => {
    onHover(id, true);
  }, [id, onHover]);

  const handleMouseLeave = useCallback(() => {
    onHover(id, false);
  }, [id, onHover]);

  useEffect(() => {
    const showTimeout = setTimeout(() => {
      setIsVisible(true);
    }, 20);

    return () => {
      clearTimeout(showTimeout);
    };
  }, []);

  return (
    message && (
      <div
        className={`${styles.notification} ${styles[type]} ${
          isVisible ? styles.fadeIn : styles.fadeOut
        }`}
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
        style={{
          top: `${10 + id * 7}rem`, // Adjust stacking based on ID
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div className={styles.iconContainer}>
          {type === "success" ? (
            <DotLottiePlayer src="/images/success.lottie" autoplay={true} />
          ) : type === "failure" ? (
            <DotLottiePlayer src="/images/failure.lottie" autoplay={true} />
          ) : type === "goodbye" ? (
            <DotLottiePlayer src="/images/goodbye.lottie" autoplay={true} />
          ) : type === "removed" ? (
            <DotLottiePlayer
              src="/images/removed.lottie"
              autoplay={true}
              direction={-1}
            />
          ) : type === "favourite" ? (
            <DotLottiePlayer src="/images/favourite.lottie" autoplay={true} />
          ) : type === "delete" ? (
            <DotLottiePlayer src="/images/delete.lottie" autoplay={true} />
          ) : type === "uploaded" ? (
            <DotLottiePlayer src="/images/uploaded.lottie" autoplay={true} />
          ) : (
            <DotLottiePlayer src="/images/warning.lottie" autoplay={true} />
          )}
        </div>
        <div className={styles.message}>{message}</div>
        <button
          onClick={handleClose}
          className={styles.closeButton}
          aria-label="Close notification"
        >
          <Thrash />
        </button>
      </div>
    )
  );
};

export { Notification };
