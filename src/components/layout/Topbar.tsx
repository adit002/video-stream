"use client";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function Topbar() {
  const [activeTab, setActiveTab] = useState<"endpoint" | "websocket">("endpoint");
  const router = useRouter();
  const pathname = usePathname();
  useEffect(() => {
    if (pathname.includes("websocket")) {
      setActiveTab("websocket");
    } else {
      setActiveTab("endpoint");
    }
  }, [pathname]);

  return (
    <div className="flex justify-center items-center bg-gray-900 text-white pt-5">
      <div className="flex gap-6 bg-gray-800 p-4 rounded-lg shadow-lg">
        <button
          onClick={() => {
            setActiveTab("endpoint");
            router.push("/video");
          }}
          className={`px-5 py-2 rounded font-medium ${
            activeTab === "endpoint" ? "bg-blue-600" : "bg-gray-700"
          }`}
        >
          Video Stream by Endpoint
        </button>
        <button
          onClick={() => {
            setActiveTab("websocket");
            router.push("/websocket");
          }}
          className={`px-5 py-2 rounded font-medium ${
            activeTab === "websocket" ? "bg-blue-600" : "bg-gray-700"
          }`}
        >
          Video Stream by WebSocket
        </button>
      </div>
    </div>
  );
}
