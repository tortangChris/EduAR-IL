import React from "react";
import ProgressCard from "../components/ProgressCard";
import RecentActivity from "../components/RecentActivity";
import HomeHeader from "../components/HomeHeader";

const Home = () => {
  const progress = 0;

  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto p-4 bg-base-100 space-y-4">
      <HomeHeader />
      <ProgressCard progress={progress} />
      <RecentActivity />
    </div>
  );
};

export default Home;
