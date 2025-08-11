import React, { useEffect, useRef } from "react";

const NotificationContent = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    const openBackCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { exact: "environment" } } // back camera
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing back camera:", err);

        // fallback sa front camera kung walang back cam
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
    <div className="bg-base-200 rounded-xl shadow-md h-[calc(100vh-6.5rem)] flex flex-col items-center justify-center text-center p-6 space-y-2">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full max-w-md rounded-lg shadow-lg"
      />
    </div>
  );
};

export default NotificationContent;
