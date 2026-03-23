"use client";

import { Toaster as Sonner, ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="dark"
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "border border-border bg-card text-card-foreground rounded-xl shadow-none",
          title: "font-body text-sm",
          description: "font-body text-sm text-muted-foreground",
        },
      }}
      {...props}
    />
  );
}
