import React from "react";
import { BrowserRouter as Router , Routes, Route, } from "react-router-dom";
import BottomNav from "./components/BottomNav";
import Home from "./pages/Home";
import Modules from "./pages/Modules";
import Notification from "./pages/Notification";
import Personal from "./pages/Personal";
import Settings from "./pages/Settings";

const App = () => {
  return (
    <Router>
      <div className="min-h-screen pb-16">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/modules" element={<Modules />} />
          <Route path="/notification" element={<Notification />} />
          <Route path="/personal" element={<Personal />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        <BottomNav />
      </div>
    </Router>
  );
};

export default App;
