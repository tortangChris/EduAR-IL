import React from "react";
import { BookOpenCheck } from "lucide-react";

const ModulesContent = () => {
  const modules = [
    {
      title: "Introduction to Data Structures",
      description: "Learn the basics of arrays, linked lists, and stacks.",
      progress: 60,
    },
    {
      title: "Algorithms 101",
      description: "Introduction to sorting and searching algorithms.",
      progress: 80,
    },
    {
      title: "Advanced Data Structures",
      description: "Dive deep into trees, heaps, and graphs.",
      progress: 40,
    },
    {
      title: "Dynamic Programming",
      description: "Master the concepts of dynamic programming.",
      progress: 90,
    },
    {
      title: "Final Assessment",
      description:
        "Complete your final assessment on Data Structures and Algorithms.",
      progress: 10,
    },
  ];

  return (
    <div className="bg-base-200 rounded-xl shadow-md h-[calc(100vh-6.5rem)] overflow-y-auto p-4 space-y-4">
      {modules.map((module, index) => (
        <div
          key={index}
          className="relative bg-white dark:bg-neutral rounded-lg p-4 shadow flex flex-col gap-3"
        >
          <div className="flex gap-3 items-start">
            <BookOpenCheck className="w-6 h-6 text-primary" />
            <div className="flex-1">
              <span className="font-semibold text-m text-primary">
                {module.title}
              </span>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {module.description}
              </p>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xs text-gray-500">Progress</span>
            <progress
              className="progress w-full progress-primary"
              value={module.progress}
              max="100"
            ></progress>
            <div className="flex justify-between mt-1">
              <span className="text-xs font-semibold text-gray-500">
                {module.progress}% Complete
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ModulesContent;
