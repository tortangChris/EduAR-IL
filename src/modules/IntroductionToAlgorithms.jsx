import React from "react";
import IntroToAlgorithmsHeader from "../components/IntroToAlgorithmsHeader";
import IntroToAlgorithmsContent from "../components/IntroToAlgorithmsContent";

const IntroductionToAlgorithms = () => {
  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto p-4 bg-base-100 space-y-4">
      <IntroToAlgorithmsHeader />
      <IntroToAlgorithmsContent />
    </div>
  );
};

export default IntroductionToAlgorithms;
