export interface ActionConfirmation<T> {
  action: "ROOM_BOOKING" | "EVENT_REGISTRATION" | "ASSIGNMENT_STATUS_UPDATE";
  status: "CONFIRMED";
  message: string;
  confirmedAt: string;
  result: T;
}

export function createActionConfirmation<T>(
  action: ActionConfirmation<T>["action"],
  message: string,
  result: T
): ActionConfirmation<T> {
  return {
    action,
    status: "CONFIRMED",
    message,
    confirmedAt: new Date().toISOString(),
    result
  };
}
