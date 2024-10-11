"use client";
import { createContext, useCallback, useState } from "react";
import { Notification } from "./components/Notification";

export const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [nextId, setNextId] = useState(1);

  const showNotification = (message, type) => {
    const id = nextId;
    setNextId(prevId => prevId + 1);
    setNotifications(prev => [...prev, { id, message, type }]);

    if (notifications.length > 0) {
      const timer = setTimeout(() => {
        setNotifications((prev) => prev.slice(1));
        setNextId(prevId => {
          const currentIds = notifications.map(notification => notification.id);
          const smallestMissingId = findSmallestMissingId(currentIds);
          return smallestMissingId !== null ? smallestMissingId : prevId;
        });
      }, 3000);

      return () => {
        clearTimeout(timer);
      };
    }
  };

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
    setNextId(prevId => {
      const currentIds = notifications.map(notification => notification.id);
      const smallestMissingId = findSmallestMissingId(currentIds);
      return smallestMissingId !== null ? smallestMissingId : prevId;
    });
  }, [notifications]);

  const findSmallestMissingId = (ids) => {
    const sortedIds = ids.sort((a, b) => a - b);
    let smallestMissingId = 1;
    for (const id of sortedIds) {
      if (id === smallestMissingId) {
        smallestMissingId++;
      } else {
        break;
      }
    }
    return smallestMissingId <= ids.length ? smallestMissingId : null;
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          id={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
      {children}
    </NotificationContext.Provider>
  );
};
