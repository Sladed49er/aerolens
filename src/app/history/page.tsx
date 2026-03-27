"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/header";
import { IdentificationResult } from "@/components/identification-result";
import { HistoryEntry } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, History, ChevronDown, ChevronUp, Plane } from "lucide-react";

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    const stored = JSON.parse(
      localStorage.getItem("aerolens-history") || "[]"
    );
    setEntries(stored);
  }, []);

  const removeEntry = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    localStorage.setItem("aerolens-history", JSON.stringify(updated));
  };

  const clearAll = () => {
    setEntries([]);
    localStorage.removeItem("aerolens-history");
  };

  return (
    <div className="flex flex-col min-h-full">
      <Header />
      <main className="flex-1 py-8 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <History className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Identification History</h1>
              <Badge variant="secondary">{entries.length}</Badge>
            </div>
            {entries.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAll}
                className="gap-2 text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
                Clear All
              </Button>
            )}
          </div>

          {entries.length === 0 ? (
            <Card className="py-16 text-center">
              <div className="flex flex-col items-center gap-3">
                <Plane className="h-10 w-10 text-muted-foreground/50" />
                <p className="text-muted-foreground">
                  No identifications yet. Go scan some planes!
                </p>
              </div>
            </Card>
          ) : (
            <div className="space-y-3">
              {entries.map((entry) => (
                <Card key={entry.id} className="overflow-hidden">
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() =>
                      setExpanded(expanded === entry.id ? null : entry.id)
                    }
                  >
                    <img
                      src={entry.imageData}
                      alt={entry.result.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {entry.result.name}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {entry.result.manufacturer} &middot;{" "}
                        {entry.result.type}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(entry.timestamp).toLocaleDateString(
                          undefined,
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeEntry(entry.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {expanded === entry.id ? (
                        <ChevronUp className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  {expanded === entry.id && (
                    <div className="px-4 pb-4 border-t">
                      <IdentificationResult result={entry.result} />
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
