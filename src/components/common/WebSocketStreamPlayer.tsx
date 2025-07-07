"use client";

import { useEffect, useRef, useState } from "react";

export default function WebSocketStreamPlayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const img = new Image();
    imgRef.current = img;

    const ws = new WebSocket("ws://localhost:3001");
    ws.binaryType = "arraybuffer";
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const blob = new Blob([event.data], { type: "image/jpeg" });
      const url = URL.createObjectURL(blob);
      img.src = url;

      img.onload = () => {
        if (ctx) {
          ctx.clearRect(0, 0, 640, 360);
          ctx.drawImage(img, 0, 0, 640, 360);
          ctx.fillStyle = "white";
          ctx.font = "12px monospace";
          ctx.fillText(`Socket video Stream`, 10, 20);
        }
        URL.revokeObjectURL(url);
      };
    };

    return () => {
      ws.close();
    };
  }, []);

  const toggleFullscreen = () => {
    const el = canvasRef.current;
    if (!el) return;

    if (!document.fullscreenElement) {
      el.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 p-8 text-white bg-black">
      <h1 className="text-xl font-bold">WebSocket Video Stream</h1>
      <canvas
        ref={canvasRef}
        width={640}
        height={360}
        className="bg-black border rounded"
      />
      <button
        onClick={toggleFullscreen}
        className="px-4 py-2 bg-green-600 rounded"
      >
        {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
      </button>
    </div>
  );
}
