import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Smart Canteen – Online Food Ordering" },
      {
        name: "description",
        content:
          "Smart Canteen – modern online food ordering for canteens, cafeterias and food courts.",
      },
    ],
  }),
});

function Index() {
  useEffect(() => {
    window.location.replace("/canteen/index.html");
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="text-2xl font-semibold mb-3">Smart Canteen</div>
        <p className="text-muted-foreground mb-4">Loading the food ordering app…</p>
        <a
          href="/canteen/index.html"
          className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Open Smart Canteen
        </a>
      </div>
    </div>
  );
}
