import { BookOpen } from "lucide-react";
import React from "react";

const ModulesHeader = () => {
  return (
    <div className="sticky top-0 z-10">
      <div className="bg-base-200 rounded-xl shadow p-4 flex items-center gap-3">
        <BookOpen className="w-6 h-6 text-primary" />
        <h2 className="text-xl font-bold">Modules</h2>
      </div>
    </div>
  );
};

export default ModulesHeader;
