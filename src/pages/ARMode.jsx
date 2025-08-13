import React from "react";

import ProgressCard from "../components/ProgressCard";
import RecentActivity from "../components/RecentActivity";
import HomeHeader from "../components/HomeHeader";

const ARMode = () => {
  const progress = 0;

  return (
    <div>
      <HomeHeader />
      <ProgressCard progress={progress} />
      <RecentActivity />
    </div>
  );
};

export default ARMode;
