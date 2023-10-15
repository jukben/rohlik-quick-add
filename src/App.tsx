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
  const [barcodesList, setBarcodesList] = useState<
    Array<{
      rawValue: string;
      date: Date;
    }>
  >([]);

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

      // Draw the left half of the video on the canvas
      context?.drawImage(
        videoRef.current, // Source video element
        0,
        0,
        videoRef.current.videoWidth,
        videoRef.current.videoHeight
      );

      if (videoRef.current.videoWidth > 0 && context) {
        const imageData = context.getImageData(
          0,
          0,
          videoRef.current.videoWidth,
          videoRef.current.videoHeight
        );

        const barcodes = await detector.detect(imageData);

        if (barcodes.length > 0) {
          const a = barcodes[0].rawValue;
          setBarcodesList([...barcodesList, { rawValue: a, date: new Date() }]);
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
      <video ref={videoRef} autoPlay playsInline style={{ display: "none" }} />
      <canvas ref={canvasRef} />
      {barcodesList.map(({ rawValue, date }) => (
        <div key={date.toISOString()}>{rawValue}</div>
      ))}
    </OnlineGuard>
  );
}

export default App;
