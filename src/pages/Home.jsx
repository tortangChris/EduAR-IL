import React, { useEffect, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

const Home = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [model, setModel] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [detected, setDetected] = useState("");

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load model
  useEffect(() => {
    cocoSsd.load().then((loadedModel) => {
      setModel(loadedModel);
      console.log("Coco-SSD loaded");
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
      console.error("Camera error:", err);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) stream.getTracks().forEach((track) => track.stop());
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setIsCameraOn(false);
    setDetected("");
    setIsScanning(false);
  };

  const detectFrame = async () => {
    if (!model || !isCameraOn) return;

    if (!videoRef.current || videoRef.current.readyState < 3) {
      requestAnimationFrame(detectFrame);
      return;
    }

    const predictions = await model.detect(videoRef.current);

    // Clear canvas
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let laptopDetected = false;

    predictions.forEach((pred) => {
      if (pred.class.toLowerCase() === "laptop" && pred.score > 0.5) {
        laptopDetected = true;
        // Draw box
        ctx.strokeStyle = "green";
        ctx.lineWidth = 4;
        ctx.strokeRect(pred.bbox[0], pred.bbox[1], pred.bbox[2], pred.bbox[3]);
        // Draw label
        ctx.fillStyle = "green";
        ctx.font = "18px Arial";
        ctx.fillText(
          `Laptop ${(pred.score * 100).toFixed(1)}%`,
          pred.bbox[0],
          pred.bbox[1] > 20 ? pred.bbox[1] - 5 : 20,
        );
      }
    });

    if (laptopDetected) {
      setDetected("💻 Laptop detected!");
      setIsScanning(false);
    } else {
      setDetected("");
      setIsScanning(true);
    }

    requestAnimationFrame(detectFrame);
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
          width={isMobile ? "90vw" : 600}
          height={isMobile ? "70vh" : 400}
          style={{
            borderRadius: "10px",
            border: "2px solid #333",
            objectFit: "cover",
          }}
        />
        <canvas
          ref={canvasRef}
          width={isMobile ? window.innerWidth * 0.9 : 600}
          height={isMobile ? window.innerHeight * 0.7 : 400}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            pointerEvents: "none",
          }}
        />
        {isScanning && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "rgba(0,0,0,0.2)",
              color: "white",
              fontSize: "24px",
              fontWeight: "bold",
            }}
          >
            Scanning...
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
        </div>
      )}
    </div>
  );
};

export default Home;
