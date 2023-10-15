import { useEffect, useRef, useState } from "react";
import { useOnlineStatus } from "./hooks/use-online-status";
import { BarcodeDetectorPolyfill } from "@undecaf/barcode-detector-polyfill";
import "./App.css";

function OnlineGuard({ children }: { children: React.ReactNode }) {
  const isOnline = useOnlineStatus();
  return isOnline ? children : "App is offline – won't work!";
}

const detector = new BarcodeDetectorPolyfill({ formats: ["ean_13"] });

async function fetchEan(ean: string) {
  const response = await fetch(`api/get-product?ean=${ean}`);
  const data = await response.json();
  return data as {
    name: string;
    rohlikPrice: {
      amount: number;
    };
  };
}

function ProductFound({
  name,
  price,
  onClick,
}: {
  name: string;
  price: number;
  onClick: () => void;
}) {
  return (
    <div id="product-found">
      <div className="wrapper">
        <h1>
          Product {name} found - {price} CZK
        </h1>
        <button onClick={onClick}>OK</button>
      </div>
    </div>
  );
}

function App() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scanning, setScanning] = useState(true);
  const [productFound, setProductFound] = useState<{
    name: string;
    rohlikPrice: {
      amount: number;
    };
  } | null>(null);

  useEffect(() => {
    async function setup() {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: import.meta.env.DEV
          ? true
          : {
              facingMode: "environment",
            },
      });

      if (!videoRef.current) {
        return;
      }

      videoRef.current.srcObject = stream;
    }

    async function detectingLoop() {
      if (!videoRef.current) {
        return;
      }

      if (videoRef.current.videoWidth > 0 && scanning) {
        const barcodes = await detector.detect(videoRef.current);

        if (barcodes.length > 0) {
          const value = barcodes[0].rawValue;

          const product = await fetchEan(value);
          setProductFound(product);
          cancelAnimationFrame(animationFrame);
          setScanning(false);

          return;
        }
      }

      requestAnimationFrame(detectingLoop);
    }

    let animationFrame: number;
    if (scanning) {
      animationFrame = requestAnimationFrame(detectingLoop);
    }

    setup();

    return () => {
      animationFrame && cancelAnimationFrame(animationFrame);
    };
  }, [scanning]);

  return (
    <OnlineGuard>
      {productFound && (
        <ProductFound
          name={productFound.name}
          price={productFound.rohlikPrice.amount}
          onClick={() => {
            setProductFound(null);
            setScanning(true);
          }}
        />
      )}
      <div id="video-wrapper">
        <video id="player" ref={videoRef} autoPlay playsInline />
      </div>
    </OnlineGuard>
  );
}

export default App;
