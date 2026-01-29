import React, { useEffect, useRef, useState } from "react";

const Home = () => {
  const videoRef = useRef(null);
  const [error, setError] = useState("");
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect if user is on mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // back camera for mobile
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setIsCameraOn(true);
      setError("");
    } catch (err) {
      setError("Camera access denied or not available.");
      console.error(err);
    }
  };

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject;
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOn(false);
  };

  useEffect(() => {
    return () => stopCamera(); // cleanup
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h2>Camera Feed</h2>

      {!isCameraOn ? (
        <button onClick={startCamera}>Enable Camera</button>
      ) : (
        <button onClick={stopCamera}>Stop Camera</button>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}

      <div
        style={{ marginTop: "20px", display: "flex", justifyContent: "center" }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            width: isMobile ? "90vw" : "600px", // full width on mobile, fixed on desktop
            maxHeight: isMobile ? "70vh" : "400px",
            borderRadius: "10px",
            border: "2px solid #333",
            objectFit: "cover", // maintain aspect ratio
          }}
        />
      </div>
    </div>
  );
};

export default Home;
