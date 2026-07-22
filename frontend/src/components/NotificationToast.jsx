import React from "react";
import { useApp } from "../context/AppContext";

const NotificationToast = () => {
  const { notifications } = useApp();
  if (!notifications || notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {notifications.map((n) => (
        <div key={n.id}
          className="bg-[#1a1b3a] border border-indigo-500/30 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl animate-fade-in max-w-xs">
          {n.message}
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
