// Home.jsx
import React from "react";
import { View3D, AROverlay } from "@egjs/view3d";

const Home = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h1>📊 Array & Time Complexity</h1>
      <p>
        Accessing an array element is <b>O(1)</b>, while searching takes{" "}
        <b>O(n)</b>.
      </p>

      {/* 3D Viewer */}
      <View3D
        src="/models/array.glb" // lagay mo glb model dito (public/models/array.glb)
        iosSrc="/models/array.usdz" // para gumana sa iOS Quick Look
        plugins={[new AROverlay()]} // enable AR overlay button
        style={{
          width: "100%",
          height: "400px",
          border: "2px solid #ccc",
          borderRadius: "10px",
        }}
      />
    </div>
  );
};

export default Home;
