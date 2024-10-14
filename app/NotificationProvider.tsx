"use client";

import React, {
  createContext,
  useReducer,
  useMemo,
  useCallback,
  useState,
  useRef,
  useEffect,
} from "react";
import { Notification } from "./components/Notification";
import {
  NotificationType,
  State,
  Action,
  NotificationItem,
} from "./notificationTypes";

export const NotificationContext = createContext<
  | {
      showNotification: (
        message: string,
        type: NotificationType,
        persistent?: boolean
      ) => void;
      removeNotification: (id: number) => void;
      notifications: NotificationItem[];
    }
  | undefined
>(undefined);

const initialState: State = {
  availableIds: [],
  notifications: [],
  nextId: 1,
};

const notificationReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_NOTIFICATION":
      return {
        ...state,
        notifications: [...state.notifications, action.payload],
        nextId: state.nextId + 1,
      };
    case "REMOVE_NOTIFICATION":
      return {
        ...state,
        notifications: state.notifications.filter(
          (notification) => notification.id !== action.payload
        ),
      };
    default:
      return state;
  }
};

const findSmallestMissingId = (ids: number[]): number => {
  const sortedIds = [...ids].sort((a, b) => a - b);
  let smallestMissingId = 1;
  for (const id of sortedIds) {
    if (id === smallestMissingId) {
      smallestMissingId++;
    } else {
      break;
    }
  }
  return smallestMissingId;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const [hoveredNotifications, setHoveredNotifications] = useState<Set<number>>(
    new Set()
  );
  const timers = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const recentMessages = useRef<Map<string, number>>(new Map());

  const handleNotificationHover = useCallback(
    (id: number, isHovered: boolean) => {
      setHoveredNotifications((prev) => {
        const newSet = new Set(prev);
        if (isHovered) {
          newSet.add(id);
        } else {
          newSet.delete(id);
        }
        return newSet;
      });
    },
    []
  );

  const showNotification = useCallback(
    (message: string, type: NotificationType, persistent = false) => {
      const currentTime = Date.now();
      const recentMessageTime = recentMessages.current.get(message);

      if (recentMessageTime && currentTime - recentMessageTime < 3000) {
        return;
      }

      const currentIds = state.notifications.map((n) => n.id);
      const id = findSmallestMissingId(currentIds);
      dispatch({
        type: "ADD_NOTIFICATION",
        payload: { id, message, type, persistent },
      });

      recentMessages.current.set(message, currentTime);

      if (!persistent) {
        const timer = setTimeout(() => {
          if (!hoveredNotifications.has(id)) {
            dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
            timers.current.delete(id);
          }
        }, 3000);

        timers.current.set(id, timer);
      }
      const cleanupTime = currentTime - 3000;
      for (const [key, time] of Object.entries(Object.fromEntries(recentMessages.current))) {
        if (time < cleanupTime) {
          recentMessages.current.delete(key);
        }
      }
      

    },
    [state.notifications, hoveredNotifications]
  );

  const removeNotification = useCallback((id: number) => {
    dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setHoveredNotifications((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  useEffect(() => {
    const currentTimers = Array.from(timers.current.values());
    return () => {
      currentTimers.forEach(clearTimeout);
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      showNotification,
      removeNotification,
      notifications: state.notifications,
    }),
    [showNotification, removeNotification, state.notifications]
  );

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      {state.notifications.map((notification) => (
        <Notification
          key={notification.id}
          {...notification}
          onRemove={removeNotification}
          onHover={handleNotificationHover}
        />
      ))}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = React.useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};
