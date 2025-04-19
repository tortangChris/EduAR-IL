import React from "react";
import { BellRing } from "lucide-react";

const NotificationHeader = () => {
  return (
    <div className="sticky top-0 z-10">
      <div className="bg-base-200 rounded-xl shadow p-4 flex items-center gap-3">
        <BellRing className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold">Notifications</h2>
      </div>
    </div>
  );
};

export default NotificationHeader;
