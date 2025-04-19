// components/RecentView.js
import React from "react";
import { BookOpen, PlaySquare, CircleCheck } from "lucide-react";

const RecentActivity = () => {
  const recentItems = [
    {
      type: "lesson",
      title: "Lesson 1: Introduction to React",
      date: "April 18, 2025",
    },
    {
      type: "module",
      title: "Module 1: Getting Started",
      date: "April 17, 2025",
    },
    {
      type: "assessment",
      title: "Assessment: React Basics",
      date: "April 15, 2025",
    },
  ];

  const renderIcon = (type) => {
    switch (type) {
      case "lesson":
        return <BookOpen className="w-5 h-5 text-primary mr-2" />;
      case "module":
        return <PlaySquare className="w-5 h-5 text-primary mr-2" />;
      case "assessment":
        return <CircleCheck className="w-5 h-5 text-primary mr-2" />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-base-200 p-4 rounded-xl shadow-md mt-6">
      <h2 className="text-lg font-bold mb-4">Recent Activity</h2>
      <ul className="space-y-3">
        {recentItems.map((item, index) => (
          <li key={index} className="flex items-start border-b pb-3">
            {renderIcon(item.type)}
            <div>
              <p className="font-medium text-sm">{item.title}</p>
              <p className="text-xs text-gray-500">{item.date}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentActivity;
