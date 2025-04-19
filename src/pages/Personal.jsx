import React from "react";
import PersonalHeader from "../components/PersonalHeader";
import PersonalContent from "../components/PersonalContent";

const Personal = () => {
  return (
    <div className="h-screen p-4 bg-base-100 space-y-4">
      <PersonalHeader />
      <PersonalContent />
    </div>
  );
};

export default Personal;
