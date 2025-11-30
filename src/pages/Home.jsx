import React, { useRef, useEffect, useState } from "react";

const Home = () => {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("Requesting camera permission...");

  useEffect(() => {
    const startCamera = async () => {
      try {
        setStatus("Opening camera...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }, // back camera for mobile
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        setStatus("Camera is running ✔️");
      } catch (err) {
        console.error(err);
        setStatus("❌ Camera access denied or unavailable.");
      }
    };

    startCamera();

    return () => {
      // Stop camera when leaving page
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
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "16px",
      }}
    >
      <h1 style={{ fontSize: "1.5rem", marginBottom: "8px" }}>
        Camera Test (EduAR)
      </h1>
      <p style={{ marginBottom: "12px" }}>{status}</p>

      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          overflow: "hidden",
          borderRadius: "12px",
          border: "2px solid #333",
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{
            width: "100%",
            transform: "scaleX(-1)", // mirror effect (optional)
          }}
        />
      </div>
    </div>
  );
};

export default Home;
