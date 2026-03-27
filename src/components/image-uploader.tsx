"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, Camera, X, Loader2, Crosshair } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ImageUploaderProps {
  onIdentify: (imageData: string) => void;
  isLoading: boolean;
}

export function ImageUploader({ onIdentify, isLoading }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (const item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) handleFile(file);
          break;
        }
      }
    },
    [handleFile]
  );

  const clear = () => {
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  return (
    <div className="w-full max-w-2xl mx-auto" onPaste={handlePaste} tabIndex={0}>
      {!preview ? (
        <Card
          className={`relative border-2 border-dashed transition-colors cursor-pointer ${
            dragOver
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          }`}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center justify-center py-16 px-6 gap-4">
            <div className="rounded-full bg-primary/10 p-4">
              <Crosshair className="h-10 w-10 text-primary" />
            </div>
            <div className="text-center">
              <p className="text-lg font-medium">
                Drop an aircraft photo here
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                or click to browse &middot; paste from clipboard &middot; use
                camera
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <Upload className="h-4 w-4" />
                Upload
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
              >
                <Camera className="h-4 w-4" />
                Camera
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="relative">
            <img
              src={preview}
              alt="Aircraft to identify"
              className="w-full max-h-[400px] object-contain bg-black/5 dark:bg-white/5"
            />
            <Button
              variant="secondary"
              size="icon"
              className="absolute top-3 right-3 rounded-full shadow-lg"
              onClick={clear}
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-4">
            <Button
              className="w-full gap-2 text-base h-12"
              onClick={() => onIdentify(preview)}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Analyzing aircraft...
                </>
              ) : (
                <>
                  <Crosshair className="h-5 w-5" />
                  Identify Aircraft
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
    </div>
  );
}
