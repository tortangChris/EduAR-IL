import React from "react";
import {
  BookOpenCheck,
  CheckCircle,
  AlarmClock,
  Sparkles,
  ClipboardCheck,
} from "lucide-react";

const NotificationContent = () => {
  const notifications = [
    {
      title: "New Lesson Available",
      message: "Lesson 2: Components is now available.",
      time: "2 hours ago",
      icon: <BookOpenCheck className="w-5 h-5 text-primary" />,
    },
    {
      title: "Module Completed",
      message: "You have completed Module 1.",
      time: "Yesterday",
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    },
    {
      title: "Assessment Reminder",
      message: "Don't forget to take your pending assessment.",
      time: "2 days ago",
      icon: <AlarmClock className="w-5 h-5 text-yellow-500" />,
    },
    {
      title: "New Update",
      message: "We’ve improved your dashboard experience!",
      time: "3 days ago",
      icon: <Sparkles className="w-5 h-5 text-indigo-500" />,
    },
    {
      title: "Achievement Unlocked",
      message: "You've completed 5 lessons!",
      time: "Last week",
      icon: <ClipboardCheck className="w-5 h-5 text-pink-500" />,
    },
    {
      title: "Assessment Scored",
      message: "Your assessment has been graded.",
      time: "2 weeks ago",
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
    },
  ];

  return (
    <div className="bg-base-200 rounded-xl shadow-md h-[calc(100vh-6.5rem)] overflow-y-auto p-4 space-y-4">
      {notifications.map((item, index) => (
        <div
          key={index}
          className="bg-white dark:bg-neutral rounded-lg p-4 shadow flex gap-3 items-start"
        >
          <div>{item.icon}</div>
          <div className="flex-1">
            <span className="font-semibold text-base text-primary">
              {item.title}
            </span>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {item.message}
            </p>
            <span className="text-xs text-gray-500">{item.time}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationContent;
