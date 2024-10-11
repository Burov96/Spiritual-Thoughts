"use client";

import React, { createContext, useReducer, useMemo, useCallback, useState, useRef, useEffect } from "react";
import { Notification } from "./components/Notification";
import { NotificationProps, NotificationType, State, Action } from "./notificationTypes";

// Create the Notification Context
export const NotificationContext = createContext<{
  showNotification: (message: string, type: NotificationType, persistent?: boolean) => void;
  removeNotification: (id: number) => void;
  notifications: NotificationProps[];
} | undefined>(undefined);

// Initial state for the reducer
const initialState: State = {
  availableIds: [],
  notifications: [],
  nextId: 1,
};

// Reducer function to handle state transitions
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

// Helper function to find the smallest missing ID
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

// NotificationProvider Component
export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const [hoveredNotifications, setHoveredNotifications] = useState<Set<number>>(new Set());
  const timers = useRef<Map<number, NodeJS.Timeout>>(new Map());

  const handleNotificationHover = useCallback((id: number, isHovered: boolean) => {
    setHoveredNotifications(prev => {
      const newSet = new Set(prev);
      if (isHovered) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  // Function to show a new notification
  const showNotification = useCallback((message: string, type: NotificationType, persistent = false) => {
    const currentIds = state.notifications.map((n) => n.id);
    const id = findSmallestMissingId(currentIds);

    dispatch({
      type: "ADD_NOTIFICATION",
      payload: { id, message, type, persistent },
    });

    // Set timer to remove the notification after 3 seconds
    if (!persistent) {
      const timer = setTimeout(() => {
        if (!hoveredNotifications.has(id)) {
          dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
          timers.current.delete(id);
        }
      }, 3000);

      timers.current.set(id, timer);
    }
  }, [state.notifications, hoveredNotifications]);

  const removeNotification = useCallback((id: number) => {
    dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setHoveredNotifications(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
  }, []);

  // Clear all timers on unmount
  useEffect(() => {
    return () => {
      timers.current.forEach(clearTimeout);
      timers.current.clear();
    };
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    showNotification,
    removeNotification,
    notifications: state.notifications,
  }), [showNotification, removeNotification, state.notifications]);
  
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

// Custom hook to use the notification context
export const useNotification = () => {
  const context = React.useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
