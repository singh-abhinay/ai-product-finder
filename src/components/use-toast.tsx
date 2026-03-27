"use client";

import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";

export interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

const ToastContext = React.createContext<{ toast: (options: ToastOptions) => void } | undefined>(undefined);

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within a ToastProvider");
  return context;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<(ToastOptions & { id: string })[]>([]);

  const toast = (options: ToastOptions) => {
    const id = Math.random().toString();
    setToasts((prev) => [...prev, { ...options, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastPrimitive.Provider swipeDirection="right">
        {toasts.map((t) => (
          <ToastPrimitive.Root
            key={t.id}
            className={`p-4 rounded-md shadow-md mb-2 ${
              t.variant === "destructive" ? "bg-red-500 text-white" : "bg-green-500 text-white"
            }`}
          >
            <ToastPrimitive.Title className="font-bold">{t.title}</ToastPrimitive.Title>
            {t.description && <ToastPrimitive.Description>{t.description}</ToastPrimitive.Description>}
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="fixed bottom-4 right-4 w-96 z-50 flex flex-col" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
};