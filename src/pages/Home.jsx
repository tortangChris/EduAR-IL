import React from "react";
import ProgressCard from "../components/ProgressCard";
import RecentActivity from "../components/RecentActivity";

const Home = () => {
  const progress = 35;

  return (
    <div className="p-4">
      <ProgressCard progress={progress} />
      <RecentActivity />
    </div>
  );
};

export default Home;
