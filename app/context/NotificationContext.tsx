// app/context/NotificationContext.tsx

"use client";

import React, {
  createContext,
  ReactNode,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useEffect,
  useRef,
} from "react";
import { Notification } from "../components/Notification";
import {
  NotificationType,
  NotificationItem,
  Action,
  State,
  NotificationContextProps,
} from "../notificationTypes";

// Create the Notification Context with default undefined
const NotificationContext = createContext<NotificationContextProps | undefined>(
  undefined
);

// Reducer function to handle state transitions
const notificationReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "ADD_NOTIFICATION": {
      const { message, type, persistent = false } = action.payload;

      // Determine the smallest missing ID
      const sortedIds = [...state.notifications.map((n) => n.id)].sort(
        (a, b) => a - b
      );
      let smallestMissingId = 1;
      for (const id of sortedIds) {
        if (id === smallestMissingId) {
          smallestMissingId++;
        } else {
          break;
        }
      }
      const id =
        smallestMissingId <= state.nextId ? smallestMissingId : state.nextId;

      // Add the new notification
      const newNotifications: NotificationItem[] = [
        ...state.notifications,
        { id, message, type, persistent },
      ];

      // Update available IDs and nextId
      const newAvailableIds = state.availableIds.filter(
        (existingId) => existingId !== id
      );
      const newNextId =
        smallestMissingId <= state.nextId ? state.nextId : state.nextId + 1;

      return {
        ...state,
        notifications: newNotifications,
        availableIds: newAvailableIds,
        nextId: newNextId,
      };
    }
    case "REMOVE_NOTIFICATION": {
      const idToRemove = action.payload;

      const newNotifications = state.notifications.filter(
        (n) => n.id !== idToRemove
      );
      const newAvailableIds = [...state.availableIds, idToRemove].sort(
        (a, b) => a - b
      );

      return {
        ...state,
        notifications: newNotifications,
        availableIds: newAvailableIds,
      };
    }
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
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const initialState: State = {
    notifications: [],
    availableIds: [],
    nextId: 1,
  };

  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const timers = useRef<Map<number, NodeJS.Timeout>>(new Map());
  const hoveredNotifications = useRef<Set<number>>(new Set());

  // Function to show a new notification
  const showNotification = useCallback(
    (message: string, type: NotificationType, persistent: boolean = false) => {
      const id = findSmallestMissingId(state.notifications.map((n) => n.id));
      const finalId = id <= state.nextId ? id : state.nextId;

      dispatch({
        type: "ADD_NOTIFICATION",
        payload: { message, type, persistent },
      });

      // Set timer to remove the notification after 3 seconds if not persistent
      if (!persistent) {
        const timer = setTimeout(() => {
          if (!hoveredNotifications.current.has(finalId)) {
            dispatch({ type: "REMOVE_NOTIFICATION", payload: finalId });
            timers.current.delete(finalId);
          }
        }, 3000);

        timers.current.set(finalId, timer);
      }
    },
    [state.notifications, state.nextId]
  );

  // Function to remove a notification manually
  const removeNotification = useCallback((id: number) => {
    dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    hoveredNotifications.current.delete(id);
  }, []);

  // Function to handle hover events
  const handleNotificationHover = useCallback((id: number, isHovered: boolean) => {
    if (isHovered) {
      hoveredNotifications.current.add(id);
      const timer = timers.current.get(id);
      if (timer) {
        clearTimeout(timer);
        timers.current.delete(id);
      }
    } else {
      hoveredNotifications.current.delete(id);
      const shouldPersist = state.notifications.find((n) => n.id === id)?.persistent;
      if (!shouldPersist) {
        const newTimer = setTimeout(() => {
          dispatch({ type: "REMOVE_NOTIFICATION", payload: id });
          timers.current.delete(id);
        }, 3000);
        timers.current.set(id, newTimer);
      }
    }
  }, [state.notifications]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      timers.current.forEach((timer) => clearTimeout(timer));
      timers.current.clear();
      hoveredNotifications.current.clear();
    };
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
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