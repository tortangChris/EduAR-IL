import React from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Home from "./Home";
import Modules from "./Modules";
import Personal from "./Personal";
import Settings from "./Settings";
import Notification from "./Notification";
import ARMode from "./ARMode";
import BottomNav from "../components/BottomNav";
import ModeNav from "../components/ModeNav";
import IntroductionToAlgorithms from "../modules/IntroductionToAlgorithms";

const MainP = () => {
  const location = useLocation();

  const showBottomNavRoutes = [
    "/",
    "/modules",
    "/armode",
    "/notification",
    "/personal",
    "/settings",
  ];

  const showModeNavRoutes = ["/modules/intro-to-algorithms"];

  const showBottomNav = showBottomNavRoutes.includes(location.pathname);
  const showModeNav = showModeNavRoutes.includes(location.pathname);

  return (
    <div>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/modules" element={<Modules />} />
        <Route path="/armode" element={<ARMode />} />
        <Route path="/notification" element={<Notification />} />
        <Route path="/personal" element={<Personal />} />
        <Route path="/settings" element={<Settings />} />
        <Route
          path="/modules/intro-to-algorithms"
          element={<IntroductionToAlgorithms />}
        />
      </Routes>
      {/* 
      {showBottomNav && <BottomNav />}
      {showModeNav && <ModeNav />} */}
    </div>
  );
};

export default MainP;
