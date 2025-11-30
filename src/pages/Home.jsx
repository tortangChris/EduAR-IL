import React, { useRef, useEffect, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

const Home = () => {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("Loading model...");
  const [detected, setDetected] = useState("");

  useEffect(() => {
    let model;

    const loadModelAndCamera = async () => {
      try {
        // Load COCO-SSD
        model = await cocoSsd.load();
        setStatus("Model Loaded ✔️");

        // Start Camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }, // back camera for mobile
          audio: false,
        });

        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStatus("Camera Running ✔️ Starting detection...");

        // Start detection loop
        detectLoop(model);
      } catch (err) {
        console.error(err);
        setStatus("❌ Error loading camera or model.");
      }
    };

    const detectLoop = async (model) => {
      if (!videoRef.current) return;

      const predictions = await model.detect(videoRef.current);

      // Look for "cell phone" class
      const phoneFound = predictions.find((p) => p.class === "cell phone");

      if (phoneFound) {
        setDetected("📱 Cellphone detected → Similar to an ARRAY (indexed items).");
      } else {
        setDetected("");
      }

      requestAnimationFrame(() => detectLoop(model));
    };

    loadModelAndCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111827",
        color: "white",
        padding: "16px",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "10px" }}>
        EduAR Object Detection (Cellphone Test)
      </h1>

      <p style={{ textAlign: "center" }}>{status}</p>

      {detected && (
        <div
          style={{
            background: "#10B981",
            padding: "10px 15px",
            borderRadius: "10px",
            marginBottom: "10px",
            textAlign: "center",
            fontWeight: "bold",
          }}
        >
          {detected}
        </div>
      )}

      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          margin: "0 auto",
          borderRadius: "12px",
          overflow: "hidden",
          border: "2px solid #333",
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: "100%" }}
        />
      </div>
    </div>
  );
};

export default Home;
