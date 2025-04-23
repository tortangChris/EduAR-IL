import React, { useState } from "react";

const ModeNav = () => {
  const [activeMode, setActiveMode] = useState("module");

  return (
    <div className="fixed bottom-8 left-0 right-0 flex justify-center z-50 px-4">
      <div className="bg-base-100 border border-base-300 shadow-xl rounded-full p-1 flex max-w-sm w-full">
        <button
          onClick={() => setActiveMode("module")}
          className={`flex-1 py-2 rounded-full font-medium transition duration-200 ${
            activeMode === "module"
              ? "bg-primary text-white"
              : "text-base-content"
          }`}
        >
          Module
        </button>
        <button
          onClick={() => setActiveMode("ar")}
          className={`flex-1 py-2 rounded-full font-medium transition duration-200 ${
            activeMode === "ar" ? "bg-primary text-white" : "text-base-content"
          }`}
        >
          AR
        </button>
      </div>
    </div>
  );
};

export default ModeNav;
