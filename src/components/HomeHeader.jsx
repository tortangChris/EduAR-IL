import React from "react";

const HomeHeader = () => {
  return (
    <div className="sticky top-0 z-10">
      <div className="bg-base-200 rounded-xl shadow p-4 flex items-center gap-3">
        <h2 className="text-xl font-bold">Welcome, [User]</h2>
      </div>
    </div>
  );
};

export default HomeHeader;
