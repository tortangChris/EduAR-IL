import { UserCircleIcon, ChevronRight } from "lucide-react";
import React from "react";

const SettingsPersonalNav = () => {
  return (
    <div className="sticky top-0 z-10">
      <div className="bg-base-200 rounded-2xl shadow-lg h-28 px-6 flex justify-between items-center max-w-md mx-auto">
        <div className="flex items-start gap-4">
          <UserCircleIcon className="w-12 h-12 text-primary" />
          <div className="mt-1">
            <h2 className="text-lg font-semibold">Full Name</h2>
            <p className="text-sm text-gray-500">user@gmail.com</p>
          </div>
        </div>
        <ChevronRight className="w-6 h-6 text-gray-400" />
      </div>
    </div>
  );
};

export default SettingsPersonalNav;
