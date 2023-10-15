import { useEffect, useRef, useState } from "react";
import { useOnlineStatus } from "./hooks/use-online-status";
import { BarcodeDetectorPolyfill } from "@undecaf/barcode-detector-polyfill";
import "./App.css";

function OnlineGuard({ children }: { children: React.ReactNode }) {
  const isOnline = useOnlineStatus();
  return isOnline ? children : "App is offline – won't work!";
}

const detector = new BarcodeDetectorPolyfill({ formats: ["ean_13"] });

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    async function setup() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      if (!videoRef.current) {
        return;
      }

      videoRef.current.srcObject = stream;
    }

    setup();
  }, []);

  useEffect(() => {
    async function swag() {
      if (!videoRef.current) {
        return;
      }

      if (!canvasRef.current) {
        return;
      }

      const canvas = canvasRef.current;

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      const context = canvasRef.current.getContext("2d");

      // Define the source region (in this case, take the left half of the video)
      const sourceX = videoRef.current.videoWidth / 2; // X-coordinate of the top-left corner of the source region
      const sourceY = videoRef.current.videoHeight / 2; // Y-coordinate of the top-left corner of the source region
      const sourceWidth = 200; // Width of the source region
      const sourceHeight = 100; // Height of the source region

      // Define the destination region (to draw on the canvas)
      const destX = 0; // X-coordinate of the top-left corner of the destination region
      const destY = 0; // Y-coordinate of the top-left corner of the destination region
      const destWidth = sourceWidth; // Width of the destination region (same as source)
      const destHeight = sourceHeight; // Height of the destination region (same as source)

      // Draw the left half of the video on the canvas
      context?.drawImage(
        videoRef.current, // Source video element
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight, // Source region
        destX,
        destY,
        destWidth,
        destHeight // Destination region
      );

      if (videoRef.current.videoWidth > 0 && context) {
        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );

        const barcodes = await detector.detect(imageData);

        if (barcodes.length > 0) {
          console.log(barcodes[0].rawValue);
        }
      }

      requestAnimationFrame(swag);
    }

    const a = requestAnimationFrame(swag);

    return () => {
      cancelAnimationFrame(a);
    };
  }, []);

  return (
    <OnlineGuard>
      <video ref={videoRef} autoPlay playsInline />
      <canvas ref={canvasRef} />
    </OnlineGuard>
  );
}

export default App;
