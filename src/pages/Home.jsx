import React, { useRef, useState } from "react";
import { Camera, XCircle } from "lucide-react";

const Home = () => {
  const videoRef = useRef(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [error, setError] = useState("");

  const openCamera = async () => {
    try {
      setError("");

      console.log("Requesting camera...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment", // back camera (mobile) or main cam
        },
        audio: false,
      });

      console.log("Camera stream:", stream);

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;

        video.onloadedmetadata = () => {
          console.log("Video metadata loaded");
          video.play();
        };
      }

      setCameraOn(true);
    } catch (err) {
      console.error("Camera error:", err);
      setError(err.message || "Camera not working.");
    }
  };

  const closeCamera = () => {
    const video = videoRef.current;
    if (video && video.srcObject) {
      const tracks = video.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      video.srcObject = null;
    }
    setCameraOn(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 gap-4">
      {!cameraOn ? (
        <button
          onClick={openCamera}
          className="flex items-center gap-2 px-6 py-3 text-white bg-blue-600 rounded-lg shadow-md hover:bg-blue-700 active:scale-95 transition"
        >
          <Camera size={20} />
          Open Camera
        </button>
      ) : (
        <button
          onClick={closeCamera}
          className="flex items-center gap-2 px-6 py-3 text-white bg-red-600 rounded-lg shadow-md hover:bg-red-700 active:scale-95 transition"
        >
          <XCircle size={20} />
          Close Camera
        </button>
      )}

      {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

      {cameraOn && (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: "500px", height: "400px", background: "black" }}
        />
      )}
    </div>
  );
};

export default Home;
