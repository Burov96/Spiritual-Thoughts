// app/notificationTypes.ts

export type NotificationType =
  | "success"
  | "failure"
  | "goodbye"
  | "removed"
  | "favourite"
  | "delete"
  | "uploaded"
  | "warning";

export interface NotificationItem {
  id: number;
  message: string;
  type: NotificationType;
  persistent?: boolean;
}

export interface NotificationProps extends NotificationItem {
  onRemove: (id: number) => void;
  onHover: (id: number, isHovered: boolean) => void;
}

export type Action =
  | { type: "ADD_NOTIFICATION"; payload: Omit<NotificationItem, "onRemove" | "onHover"> }
  | { type: "REMOVE_NOTIFICATION"; payload: number };

export interface State {
  notifications: NotificationItem[];
  availableIds: number[];
  nextId: number;
}

export interface NotificationContextProps {
  showNotification: (
    message: string,
    type: NotificationType,
    persistent?: boolean
  ) => void;
  removeNotification: (id: number) => void;
  notifications: NotificationItem[];
}
