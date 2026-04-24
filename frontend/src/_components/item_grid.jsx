import React from "react";
import { Link } from "react-router-dom";

import Chat from "./pages/Chat";
import Guide from "./pages/Guide";
import RecommendPage from "./pages/RecommendPage";

const data = [
  {
    path: "/ai-menu",
    element: <Chat />,
    label: "AI Suggestions Menu",
    icon: "⚡",
  },
  { path: "/guide", element: <Guide />, label: "Recommendation", icon: "🌐" },
  {
    path: "/recommendation",
    element: <RecommendPage />,
    label: "Cooking Guide",
    icon: "🍳",
  },
];

function Grid() {
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium uppercase tracking-wider text-gray-400">
        Our offerings
      </p>
      <div className="grid grid-cols-3 gap-3">
        {data.map((item, idx) => (
          <Link
            key={idx}
            to={item.path}
            className="bg-[#4d5d1c] p-4 hover:bg-[#5a6d21] rounded-lg flex flex-col items-center text-center justify-center aspect-square transition-colors no-underline"
          >
            <div className="mb-2 text-xl">{item.icon}</div>
            <span className="text-[10px] leading-tight uppercase font-semibold text-white">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default Grid;
