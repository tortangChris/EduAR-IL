// pages/Notification.jsx
import React from "react";
import NotificationHeader from "../components/NotificationHeader";
import NotificationContent from "../components/NotificationContent";

const Notification = () => {
  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto p-4 bg-base-100 space-y-4">
      <NotificationHeader />
      <NotificationContent />
    </div>
  );
};

export default Notification;
