import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./Home";
import Modules from "./Modules";
import Personal from "./Personal";
import Settings from "./Settings";
import Notification from "./Notification";
import ARMode from "./ARMode";

const MainP = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/modules" element={<Modules />} />
      <Route path="/armode" element={<ARMode />} />
      <Route path="/notification" element={<Notification />} />
      <Route path="/personal" element={<Personal />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
};

export default MainP;
