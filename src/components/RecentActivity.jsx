import React from "react";
import { BookOpen } from "lucide-react";

const RecentActivity = () => {
  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="bg-base-200 p-4 rounded-xl shadow-md mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Recent Activity</h2>
        <span className="text-sm text-gray-500">As of {currentDate}</span>
      </div>
      <div className="flex flex-col items-center justify-center py-8 text-gray-500">
        <BookOpen className="w-10 h-10 mb-2 text-gray-700" />
        <p className="text-sm">Recent Activities will appear here</p>
      </div>
    </div>
  );
};

export default RecentActivity;
