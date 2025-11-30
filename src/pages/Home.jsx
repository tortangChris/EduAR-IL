import React, { useRef, useEffect, useState } from "react";
import * as cocoSsd from "@tensorflow-models/coco-ssd";
import "@tensorflow/tfjs";

const Home = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  const [status, setStatus] = useState("Loading model...");
  const [arrayCount, setArrayCount] = useState(0);
  const [debugLabels, setDebugLabels] = useState([]);

  useEffect(() => {
    let model = null;
    let animationFrameId = null;
    let lastDetectionTime = 0;
    const DETECTION_INTERVAL = 250; // ms (around 4fps – less lag)

    const load = async () => {
      try {
        // Load model
        model = await cocoSsd.load();
        setStatus("Model Loaded ✔️");

        // Start camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });

        if (!videoRef.current) return;

        videoRef.current.srcObject = stream;

        // Wait hanggang may video frame na
        videoRef.current.onloadeddata = () => {
          setStatus("Camera Running ✔️ Detecting objects...");
          detectLoop();
        };
      } catch (e) {
        console.error(e);
        setStatus("❌ Error loading camera or model.");
      }
    };

    const detectLoop = async () => {
      if (!model || !videoRef.current) {
        animationFrameId = requestAnimationFrame(detectLoop);
        return;
      }

      const now = performance.now();
      // Throttle detection (para di lag)
      if (now - lastDetectionTime < DETECTION_INTERVAL) {
        animationFrameId = requestAnimationFrame(detectLoop);
        return;
      }
      lastDetectionTime = now;

      try {
        const predictions = await model.detect(videoRef.current);

        // Debug list of detected classes
        setDebugLabels(
          predictions.map((p) => `${p.class} (${(p.score * 100).toFixed(0)}%)`)
        );

        drawBoxes(predictions);
      } catch (err) {
        console.error("Detection error:", err);
      }

      animationFrameId = requestAnimationFrame(detectLoop);
    };

    const drawBoxes = (predictions) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const ctx = canvas.getContext("2d");

      // Match canvas size with video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Filter only "cell phone" with enough confidence
      const phones = predictions.filter(
        (p) => p.class === "cell phone" && p.score > 0.4
      );

      setArrayCount(phones.length);

      phones.forEach((p, index) => {
        const [x, y, width, height] = p.bbox;

        // Green box
        ctx.strokeStyle = "#00ff00";
        ctx.lineWidth = 4;
        ctx.strokeRect(x, y, width, height);

        // Label background
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(x, y - 30, width, 30);

        // Label text
        ctx.fillStyle = "#00ff00";
        ctx.font = "20px Arial";
        ctx.fillText(`cellphone[${index}]`, x + 5, y - 10);
      });
    };

    load();

    return () => {
      // stop camera
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
      // stop animation frame
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111827",
        color: "white",
        padding: "12px",
      }}
    >
      <h1 style={{ textAlign: "center" }}>EduAR – Array Detection Demo</h1>

      <p style={{ textAlign: "center", marginTop: "4px" }}>{status}</p>

      <p style={{ textAlign: "center", marginTop: "6px", fontSize: "1.1rem" }}>
        📱 Cellphones detected as Array elements:{" "}
        <strong>{arrayCount}</strong>
      </p>

      {/* Debug panel para makita ano nade-detect ng model */}
      <div
        style={{
          maxWidth: "480px",
          margin: "8px auto",
          background: "#1f2937",
          borderRadius: "8px",
          padding: "8px",
          fontSize: "0.8rem",
        }}
      >
        <strong>Debug (detected classes):</strong>
        {debugLabels.length === 0 ? (
          <div style={{ marginTop: "4px" }}>None</div>
        ) : (
          <ul style={{ marginTop: "4px", paddingLeft: "18px" }}>
            {debugLabels.map((lbl, i) => (
              <li key={i}>{lbl}</li>
            ))}
          </ul>
        )}
      </div>

      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: "480px",
          margin: "0 auto",
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            borderRadius: "10px",
          }}
        />

        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />
      </div>
    </div>
  );
};

export default Home;
