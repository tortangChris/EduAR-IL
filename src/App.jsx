import React from "react";
import MainP from "./pages/MainP";
import BottomNav from "./components/BottomNav";
import { BrowserRouter } from "react-router-dom";

const App = () => {
  return (
    <BrowserRouter>
      <div className="min-h-screen pb-16">
        <MainP />
        <BottomNav />
      </div>
    </BrowserRouter>
  );
};

export default App;
