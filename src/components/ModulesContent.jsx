import React, { useState } from "react";
import { BookOpenCheck, ChevronRight, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

const ModulesContent = () => {
  const navigate = useNavigate();
  const activeModuleTitle = "Introduction to Algorithms";

  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const modules = [
    {
      title: "Introduction to Algorithms",
      description:
        "Get started with algorithm basics and how they shape problem-solving.",
      progress: 0,
      route: "/modules/intro-to-algorithms",
    },
    {
      title: "Searching Algorithms",
      description:
        "Explore various searching techniques including linear and binary search.",
      progress: 0,
      route: "/modules/searching-algorithms",
    },
    {
      title: "Sorting Algorithms",
      description:
        "Understand sorting methods like bubble, selection, merge, and quick sort.",
      progress: 0,
      route: "/modules/sorting-algorithms",
    },
    {
      title: "Introduction to Data Structures",
      description: "Learn the basics of arrays, linked lists, and stacks.",
      progress: 0,
      route: "/modules/data-structures-intro",
    },
    {
      title: "Advanced Data Structures",
      description: "Dive deep into trees, heaps, and graphs.",
      progress: 0,
      route: "/modules/advanced-data-structures",
    },
    {
      title: "Graph Algorithms",
      description:
        "Master algorithms like BFS, DFS, and Dijkstra’s for solving graph problems.",
      progress: 0,
      route: "/modules/graph-algorithms",
    },
    {
      title: "Dynamic Programming",
      description: "Master the concepts of dynamic programming.",
      progress: 0,
      route: "/modules/dynamic-programming",
    },
    {
      title: "Final Assessment",
      description:
        "Complete your final assessment on Data Structures and Algorithms.",
      progress: 0,
      route: "/modules/final-assessment",
    },
  ];

  const handleClick = (module) => {
    if (module.title === activeModuleTitle) {
      navigate(module.route);
    } else {
      setErrorMessage(
        // `⚠️ You need to finish "${activeModuleTitle}" before opening "${module.title}".`
        `⚠️ You need to finish "${activeModuleTitle}"".`
      );
      setShowError(true);
      setTimeout(() => setShowError(false), 3000);
    }
  };

  return (
    <div className="relative">
      {showError && (
        <div className="alert alert-error shadow-lg fixed top-4 right-4 z-50 w-[20rem] animate-fade-in">
          <div className="flex items-center justify-between w-full">
            <span>{errorMessage}</span>
            <button onClick={() => setShowError(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="bg-base-200 rounded-xl shadow-md h-[calc(100vh-6.5rem)] overflow-y-auto p-4 space-y-4">
        {modules.map((module, index) => {
          const isClickable = module.title === activeModuleTitle;

          return (
            <button
              key={index}
              onClick={() => handleClick(module)}
              className={`w-full text-left rounded-lg p-4 shadow flex flex-col gap-3 transition-all duration-150
                ${
                  isClickable
                    ? "cursor-pointer bg-white dark:bg-neutral hover:ring-2 hover:ring-primary hover:scale-[1.01]"
                    : "cursor-not-allowed bg-gray-100 dark:bg-base-300 opacity-70"
                }`}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="flex gap-3 items-start">
                  <BookOpenCheck className="w-5 h-5 min-w-[1.25rem] min-h-[1.25rem] text-primary" />

                  <div>
                    <span className="font-semibold text-m text-primary">
                      {module.title}
                    </span>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {module.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 min-w-[1rem] min-h-[1rem] text-primary mt-1" />
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
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ModulesContent;
