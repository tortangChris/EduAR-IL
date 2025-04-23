import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const IntroToAlgorithmsHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="sticky top-0 z-10">
      <div className="bg-base-200 rounded-xl shadow p-4 flex items-center gap-3">
        <button
          onClick={() => navigate("/modules")}
          className="p-2 rounded-full hover:bg-base-300 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-m font-bold">Introduction To Algorithms</h2>
      </div>
    </div>
  );
};

export default IntroToAlgorithmsHeader;
