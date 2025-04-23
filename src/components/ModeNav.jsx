import React, { useState } from "react";
import { X } from "lucide-react";

const ModeNav = () => {
  const [activeMode, setActiveMode] = useState("module");
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleArClick = () => {
    if (activeMode !== "ar") {
      setErrorMessage("⚠️ AR Mode is not available right now.");
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
            <button onClick={() => setShowError(false)} className="ml-4">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

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
            onClick={handleArClick}
            className={`flex-1 py-2 rounded-full font-medium transition duration-200 ${
              activeMode === "ar"
                ? "bg-primary text-white"
                : "text-base-content"
            }`}
            disabled={activeMode === "ar"}
            A
          >
            AR
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModeNav;
