import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./Home";
import Modules from "./Modules";
import Personal from "./Personal";
import Settings from "./Settings";

const MainP = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/modules" element={<Modules />} />
      <Route path="/personal" element={<Personal />} />
      <Route path="/settings" element={<Settings />} />
    </Routes>
  );
};

export default MainP;
