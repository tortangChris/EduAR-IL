import React from "react";
import { Bell } from "lucide-react";

const NotificationContent = () => {
  const notifications = []; // Empty array for now

  return (
    <div className="bg-base-200 rounded-xl shadow-md h-[calc(100vh-6.5rem)] flex flex-col items-center justify-center text-center p-6 space-y-2">
      <Bell className="w-16 h-16 text-gray-400" />
      <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">
        No Notification Yet
      </h2>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        You have no notification right now.
        <br />
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Come back later.
      </p>
    </div>
  );
};

export default NotificationContent;
