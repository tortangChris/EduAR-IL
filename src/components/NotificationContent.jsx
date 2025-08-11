import React, { useEffect, useRef } from "react";

const NotificationContent = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    const openBackCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: "environment" } }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing back camera:", err);

        // fallback sa front camera
        try {
          const fallbackStream = await navigator.mediaDevices.getUserMedia({ video: true });
          if (videoRef.current) {
            videoRef.current.srcObject = fallbackStream;
          }
        } catch (fallbackErr) {
          console.error("Error accessing fallback camera:", fallbackErr);
        }
      }
    };

    openBackCamera();
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default NotificationContent;
