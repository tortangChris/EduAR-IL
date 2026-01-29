import React, { useEffect, useRef, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

const Home = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState("");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [model, setModel] = useState(null);
  const [detectedObject, setDetectedObject] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);

  // Detect mobile vs desktop
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Load TensorFlow model
  useEffect(() => {
    const loadModel = async () => {
      try {
        const loadedModel = await cocoSsd.load();
        setModel(loadedModel);
        console.log("Model loaded");
      } catch (err) {
        setError("Failed to load TensorFlow model.");
        console.error(err);
      }
    };
    loadModel();
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      if (videoRef.current) videoRef.current.srcObject = stream;

      setIsCameraOn(true);
      setError("");
      setDetectedObject(null);
      setIsDetecting(true);
    } catch (err) {
      setError("Camera access denied or not available.");
      console.error(err);
    }
  };

  // Stop camera
  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) stream.getTracks().forEach((track) => track.stop());

    if (videoRef.current) videoRef.current.srcObject = null;
    setIsCameraOn(false);
    setIsDetecting(false);
    clearCanvas();
  };

  // Clear canvas
  const clearCanvas = () => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  };

  // Detection loop
  useEffect(() => {
    let animationId;

    const detectFrame = async () => {
      if (
        !model ||
        !videoRef.current ||
        videoRef.current.readyState < 2 ||
        !isDetecting
      ) {
        animationId = requestAnimationFrame(detectFrame);
        return;
      }

      const predictions = await model.detect(videoRef.current);

      const ctx = canvasRef.current.getContext("2d");
      const video = videoRef.current;

      canvasRef.current.width = video.videoWidth;
      canvasRef.current.height = video.videoHeight;

      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.lineWidth = 2;
      ctx.font = "18px Arial";
      ctx.strokeStyle = "red";
      ctx.fillStyle = "red";

      if (predictions.length > 0) {
        // Take the first detected object
        const first = predictions[0];
        setDetectedObject(
          `${first.class} (${(first.score * 100).toFixed(1)}%)`,
        );
        setIsDetecting(false); // stop detection after first object

        // Draw only the first detection
        const [x, y, width, height] = first.bbox;
        ctx.strokeRect(x, y, width, height);
        ctx.fillText(
          `${first.class} (${(first.score * 100).toFixed(1)}%)`,
          x,
          y > 20 ? y - 5 : y + 20,
        );

        return; // stop further detection until user presses "Detect Again"
      }

      // No object detected, keep drawing loop
      animationId = requestAnimationFrame(detectFrame);
    };

    if (isCameraOn) detectFrame();

    return () => cancelAnimationFrame(animationId);
  }, [isCameraOn, model, isDetecting]);

  // Restart detection
  const handleDetectAgain = () => {
    setDetectedObject(null);
    clearCanvas();
    setIsDetecting(true);
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Camera + Single Object Detection</h2>

      {detectedObject && (
        <h3 style={{ color: "green" }}>Detected: {detectedObject}</h3>
      )}

      {!isCameraOn ? (
        <button onClick={startCamera}>Enable Camera</button>
      ) : (
        <>
          <button onClick={stopCamera}>Stop Camera</button>
          {!isDetecting && (
            <button onClick={handleDetectAgain} style={{ marginLeft: "10px" }}>
              Detect Again
            </button>
          )}
        </>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

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
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: isMobile ? "90vw" : "600px",
            maxHeight: isMobile ? "70vh" : "400px",
            borderRadius: "10px",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
};

export default Home;
