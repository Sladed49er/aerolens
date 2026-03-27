"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Header } from "@/components/header";
import { ImageUploader } from "@/components/image-uploader";
import { IdentificationResult } from "@/components/identification-result";
import { AircraftIdentification, HistoryEntry } from "@/lib/types";
import { toast } from "sonner";
import { Camera, Brain, Zap, Plane } from "lucide-react";

export default function Home() {
  const { isSignedIn } = useUser();
  const [result, setResult] = useState<AircraftIdentification | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleIdentify = async (imageData: string) => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageData }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Identification failed");
      }

      const data: AircraftIdentification = await response.json();
      setResult(data);

      if (data.identified && isSignedIn) {
        const entry: HistoryEntry = {
          id: crypto.randomUUID(),
          imageData,
          result: data,
          timestamp: new Date().toISOString(),
        };
        const existing = JSON.parse(
          localStorage.getItem("aerolens-history") || "[]"
        );
        localStorage.setItem(
          "aerolens-history",
          JSON.stringify([entry, ...existing].slice(0, 50))
        );
      }

      if (data.identified) {
        toast.success(`Identified: ${data.name}`);
      } else {
        toast.error("Could not identify aircraft");
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      <Header />
      <main className="flex-1">
        <section className="py-12 px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
              Identify Any Aircraft
              <br />
              <span className="text-primary">Instantly with AI</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-10">
              Snap a photo, upload an image, or paste from your clipboard.
              AeroLens identifies aircraft from around the world with detailed
              specs and history.
            </p>

            <ImageUploader onIdentify={handleIdentify} isLoading={isLoading} />

            {result && <IdentificationResult result={result} />}
          </div>
        </section>

        {!result && !isLoading && (
          <section className="py-12 px-4 border-t">
            <div className="max-w-4xl mx-auto">
              <div className="grid sm:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 mb-4">
                    <Camera className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Any Aircraft</h3>
                  <p className="text-sm text-muted-foreground">
                    Commercial airliners, military jets, helicopters, vintage
                    warbirds, private planes, and more.
                  </p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 mb-4">
                    <Brain className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">AI-Powered</h3>
                  <p className="text-sm text-muted-foreground">
                    Powered by Claude AI with deep knowledge of thousands of
                    aircraft types from every era and country.
                  </p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-3 mb-4">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">Rich Details</h3>
                  <p className="text-sm text-muted-foreground">
                    Get full specs, history, operator identification, livery
                    details, and fun facts with every scan.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      <footer className="border-t py-6 px-4 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2">
          <Plane className="h-4 w-4" />
          <span>AeroLens &mdash; AI Aircraft Identification</span>
        </div>
      </footer>
    </div>
  );
}
