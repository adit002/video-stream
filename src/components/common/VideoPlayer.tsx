"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  videoUrl: string;
  overlayText?: string;
};

export default function VideoPlayer({ videoUrl, overlayText }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const webglCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
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
    const canvas = webglCanvasRef.current;
    const gl = canvas?.getContext("webgl");

    if (!video || !canvas || !gl) return;

    const vertexShaderSource = `
      attribute vec2 a_position;
      attribute vec2 a_texCoord;
      varying vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0, 1);
        v_texCoord = a_texCoord;
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      varying vec2 v_texCoord;
      uniform sampler2D u_texture;
      void main() {
        gl_FragColor = texture2D(u_texture, v_texCoord);
      }
    `;

    const compileShader = (source: string, type: number) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
        return null;
      }
      return shader;
    };

    const vertexShader = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fragmentShader = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);

    const program = gl.createProgram()!;
    gl.attachShader(program, vertexShader!);
    gl.attachShader(program, fragmentShader!);
    gl.linkProgram(program);
    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, "a_position");
    const texCoordLocation = gl.getAttribLocation(program, "a_texCoord");

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 0, 1,
       1, -1, 1, 1,
      -1,  1, 0, 0,
       1,  1, 1, 0,
    ]), gl.STATIC_DRAW);

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 16, 8);

    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    let frameId: number;

    const render = () => {
      if (!video || video.paused || video.ended) return;

      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);

      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      frameId = requestAnimationFrame(render);
    };

    video.addEventListener("play", render);
    video.addEventListener("pause", () => cancelAnimationFrame(frameId));
    video.addEventListener("timeupdate", () => setCurrentTime(video.currentTime));
    video.addEventListener("loadedmetadata", () => setDuration(video.duration));

    return () => cancelAnimationFrame(frameId);
  }, []);

  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas || !overlayText) return;

    const ctx = canvas.getContext("2d");

    const drawOverlay = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "white";
      ctx.font = "bold 18px sans-serif";
      ctx.fillText(overlayText, 20, 30);
      requestAnimationFrame(drawOverlay);
    };

    drawOverlay();
    return () => ctx?.clearRect(0, 0, canvas.width, canvas.height);
  }, [overlayText]);

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
      <h2 className="text-xl font-semibold">Endpoint Video Stream</h2>

      {loading && <p className="text-sm text-gray-400">Loading video...</p>}
      {error && <p className="text-sm text-red-400">Error loading video.</p>}

      <div className="relative w-fit">
        <canvas
          ref={webglCanvasRef}
          width={640}
          height={360}
          className="bg-black rounded-md shadow-md"
        />
        <canvas
          ref={overlayCanvasRef}
          width={640}
          height={360}
          className="absolute top-0 left-0 pointer-events-none"
        />
      </div>

      <video
        ref={videoRef}
        src={videoUrl}
        playsInline
        preload="auto"
        crossOrigin="anonymous"
        onLoadedData={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        className="absolute w-0 h-0 overflow-hidden"
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
