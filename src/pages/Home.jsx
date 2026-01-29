import React, { useEffect, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

const Home = () => {
  const videoRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [detected, setDetected] = useState("");
  const [model, setModel] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  // Detect if user is on mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load TensorFlow model
  useEffect(() => {
    cocoSsd.load().then((loadedModel) => {
      setModel(loadedModel);
      console.log("Coco-SSD model loaded!");
    });
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraOn(true);
      setDetected("");
      setIsScanning(true);
      detectFrame();
    } catch (err) {
      console.error("Camera access denied or not available.", err);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
    setDetected("");
    setIsScanning(false);
  };

  // Detect objects frame by frame
  const detectFrame = async () => {
    if (!model || !isCameraOn) return;

    // Wait until video is ready
    if (!videoRef.current || videoRef.current.readyState < 3) {
      requestAnimationFrame(detectFrame);
      return;
    }

    try {
      const predictions = await model.detect(videoRef.current);

      const laptop = predictions.find(
        (p) => p.class.toLowerCase() === "laptop" && p.score > 0.5,
      );

      if (laptop) {
        setDetected("💻 Laptop detected!");
        setIsScanning(false);
        console.log("Laptop detected:", laptop);
        return;
      } else {
        setDetected("");
        setIsScanning(true);
      }
    } catch (err) {
      console.error("Error detecting frame:", err);
    }

    requestAnimationFrame(detectFrame);
  };

  const resetDetection = () => {
    setDetected("");
    setIsScanning(true);
    detectFrame();
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Camera Feed with Laptop Detection</h2>

      {!isCameraOn ? (
        <button onClick={startCamera}>Enable Camera</button>
      ) : (
        <button onClick={stopCamera}>Stop Camera</button>
      )}

      <div
        style={{
          marginTop: "20px",
          display: "flex",
          justifyContent: "center",
          position: "relative",
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: isMobile ? "90vw" : "600px",
            maxHeight: isMobile ? "70vh" : "400px",
            borderRadius: "10px",
            border: "2px solid #333",
            objectFit: "cover",
          }}
        />

        {/* Scanning overlay */}
        {isScanning && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-100%",
                width: "100%",
                height: "100%",
                background:
                  "linear-gradient(to bottom, transparent 0%, rgba(0,255,0,0.3) 50%, transparent 100%)",
                animation: "scanLine 2s linear infinite",
              }}
            />
          </div>
        )}
      </div>

      {detected && (
        <div
          style={{
            marginTop: "20px",
            padding: "10px",
            border: "2px solid green",
            borderRadius: "5px",
            background: "#d4edda",
            color: "#155724",
            fontWeight: "bold",
          }}
        >
          {detected}
          <div style={{ marginTop: "10px" }}>
            <button onClick={resetDetection}>Detect Again</button>
          </div>
        </div>
      )}

      {/* CSS Animation */}
      <style>
        {`
          @keyframes scanLine {
            0% { top: -100%; }
            100% { top: 100%; }
          }
        `}
      </style>
    </div>
  );
};

export default Home;
