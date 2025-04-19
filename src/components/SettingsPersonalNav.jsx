import { UserCircleIcon, ChevronRight } from "lucide-react";
import React from "react";
import { useNavigate } from "react-router-dom";

const SettingsPersonalNav = () => {
  const navigate = useNavigate();

  const handleNavigate = () => {
    navigate("/personal");
  };

  return (
    <div
      onClick={handleNavigate}
      className="bg-base-200 rounded-2xl shadow-lg h-28 px-6 flex justify-between items-center w-full cursor-pointer hover:bg-base-300 transition-colors"
    >
      <div className="flex items-start gap-4">
        <UserCircleIcon className="w-12 h-12 text-primary" />
        <div className="mt-1">
          <h2 className="text-lg font-semibold">Full Name</h2>
          <p className="text-sm text-gray-500">user@gmail.com</p>
        </div>
      </div>
      <ChevronRight className="w-6 h-6 text-gray-400" />
    </div>
  );
};

export default SettingsPersonalNav;
