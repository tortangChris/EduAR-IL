import React from "react";
import ProgressCard from "../components/ProgressCard";

const Home = () => {
  const progress = 35;

  return (
    <div className="p-4">
      <ProgressCard progress={progress} />
    </div>
  );
};

export default Home;
