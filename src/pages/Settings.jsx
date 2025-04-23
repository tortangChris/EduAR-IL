import React from "react";
import SettingsPersonalNav from "../components/SettingsPersonalNav";
import SettingsContent from "../components/SettingsContent";

const Settings = () => {
  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto p-4 bg-base-100 space-y-4">
      <SettingsPersonalNav />
      <SettingsContent />
    </div>
  );
};

export default Settings;
