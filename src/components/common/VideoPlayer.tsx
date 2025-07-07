"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  videoUrl: string;
  overlayText?: string;
};

export default function VideoPlayer({ videoUrl, overlayText }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    let frameId: number;

    const render = () => {
      if (video && canvas && ctx && !video.paused && !video.ended) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        if (overlayText) {
          ctx.fillStyle = "white";
          ctx.font = "14px sans-serif";
          ctx.fillText(overlayText, 10, 20);
        }
        frameId = requestAnimationFrame(render);
      }
    };

    if (video) {
      video.addEventListener("play", render);
      video.addEventListener("pause", () => cancelAnimationFrame(frameId));
      video.addEventListener("timeupdate", () =>
        setCurrentTime(video.currentTime)
      );
      video.addEventListener("loadedmetadata", () =>
        setDuration(video.duration)
      );
    }

    return () => cancelAnimationFrame(frameId);
  }, [overlayText]);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const captureThumbnail = () => {
      video.currentTime = 0.1;
      video.addEventListener(
        "seeked",
        () => {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          }
        },
        { once: true }
      );
    };

    video.addEventListener("loadeddata", captureThumbnail);
    return () => video.removeEventListener("loadeddata", captureThumbnail);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    const mins = Math.floor(time / 60)
      .toString()
      .padStart(2, "0");
    const secs = Math.floor(time % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-4 text-white w-full max-w-xl mx-auto"
    >
      <h2 className="text-xl font-semibold">Video Player</h2>

      {loading && <p className="text-sm text-gray-400">Loading video...</p>}
      {error && <p className="text-sm text-red-400">Error loading video.</p>}

      <canvas
        ref={canvasRef}
        width={640}
        height={360}
        className="bg-black rounded-md shadow-md"
      />

      <video
        ref={videoRef}
        src={videoUrl}
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        onCanPlay={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        className="hidden"
      />

      <div className="flex flex-wrap gap-3 mt-2">
        <button
          onClick={togglePlay}
          className="bg-blue-600 px-4 py-1 rounded text-sm hover:bg-blue-700"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
        <button
          onClick={toggleMute}
          className="bg-gray-600 px-4 py-1 rounded text-sm hover:bg-gray-700"
        >
          {isMuted ? "Unmute" : "Mute"}
        </button>
        <button
          onClick={toggleFullscreen}
          className="bg-green-600 px-4 py-1 rounded text-sm hover:bg-green-700"
        >
          {isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
        </button>
      </div>

      <div className="flex items-center gap-3 text-sm">
        <span className="w-12 text-right">{formatTime(currentTime)}</span>
        <input
          type="range"
          min={0}
          max={duration || 0}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="flex-1 accent-blue-500"
        />
        <span className="w-12 text-left">{formatTime(duration)}</span>
      </div>
    </div>
  );
}
