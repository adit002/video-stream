import VideoPlayer from "@/components/common/VideoPlayer";

export default function VideoPage() {
  return (
    <main className="min-h-screen bg-gray-900 p-8 text-white flex flex-col items-center justify-center">
      <VideoPlayer
        videoUrl="http://localhost:3001/video"
        overlayText="Video Stream"
      />
    </main>
  );
}
