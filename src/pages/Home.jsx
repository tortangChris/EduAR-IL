import React from "react";
import { CircleCheck, BookOpen, PlaySquare } from "lucide-react";

const Home = () => {
  const progress = 35;

  return (
    <div className="p-4">
      <div className="bg-base-200 p-4 rounded-xl shadow-md">
        <div className="flex items-center gap-4">
          <div
            className="radial-progress text-primary"
            style={{ "--value": progress }}
            role="progressbar"
          >
            {progress}%
          </div>

          <div>
            <h2 className="text-lg font-bold">Overall Progress</h2>
            <p className="text-sm text-gray-500">
              Keep going! You're doing great.
            </p>
          </div>
        </div>

        <div className="divider my-4"></div>

        <div className="grid grid-cols-3 gap-4 text-center text-sm font-medium">
          <div className="flex flex-col items-center">
            <BookOpen className="w-6 h-6 text-primary mb-1" />
            <span>Lessons</span>
            <span className="text-xs text-gray-500">0 / 50</span>
          </div>

          <div className="flex flex-col items-center">
            <PlaySquare className="w-6 h-6 text-primary mb-1" />
            <span>Modules</span>
            <span className="text-xs text-gray-500">0 / 5</span>
          </div>

          <div className="flex flex-col items-center">
            <CircleCheck className="w-6 h-6 text-primary mb-1" />
            <span>Assessment</span>
            <span className="text-xs text-gray-500">1 pending</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
