"use client";

import { useToastStore } from "@/lib/toast";

export function Toaster() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 z-50 flex flex-col gap-2 md:bottom-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          onClick={() => dismiss(toast.id)}
          className={`cursor-pointer rounded-md px-4 py-2.5 text-sm font-medium text-white shadow-xl transition-all ${
            toast.type === "error" ? "bg-red-600" : "bg-emerald-600"
          }`}
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
}
