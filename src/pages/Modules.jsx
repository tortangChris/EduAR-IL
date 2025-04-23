import React from "react";
import ModulesHeader from "../components/ModulesHeader";
import ModulesContent from "../components/ModulesContent";

const Modules = () => {
  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto p-4 bg-base-100 space-y-4">
      <ModulesHeader />
      <ModulesContent />
    </div>
  );
};

export default Modules;
