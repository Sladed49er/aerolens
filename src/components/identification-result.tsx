"use client";

import { useState } from "react";
import { AircraftIdentification } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Plane,
  Gauge,
  Ruler,
  Wind,
  Globe,
  Lightbulb,
  MapPin,
  Users,
  Factory,
  Target,
  ThumbsUp,
  ThumbsDown,
  Send,
  Loader2,
  Eye,
  Check,
} from "lucide-react";

interface IdentificationResultProps {
  result: AircraftIdentification;
  onCorrection?: (correction: string) => void;
  isCorrecting?: boolean;
}

export function IdentificationResult({
  result,
  onCorrection,
  isCorrecting,
}: IdentificationResultProps) {
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [correctionText, setCorrectionText] = useState("");

  if (!result.identified) {
    return (
      <Card className="max-w-2xl mx-auto mt-6">
        <CardContent className="pt-6 text-center">
          <p className="text-muted-foreground">
            Could not identify the aircraft in this image. Try a clearer photo
            with the aircraft more visible.
          </p>
        </CardContent>
      </Card>
    );
  }

  const confidenceColor = {
    high: "bg-green-500/15 text-green-700 dark:text-green-400",
    medium: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
    low: "bg-red-500/15 text-red-700 dark:text-red-400",
  };

  const specs = Object.entries(result.specs).filter(([, v]) => v);

  const specIcons: Record<string, React.ReactNode> = {
    wingspan: <Ruler className="h-4 w-4" />,
    length: <Ruler className="h-4 w-4" />,
    maxSpeed: <Gauge className="h-4 w-4" />,
    range: <Globe className="h-4 w-4" />,
    ceiling: <Wind className="h-4 w-4" />,
    engines: <Target className="h-4 w-4" />,
    crew: <Users className="h-4 w-4" />,
    capacity: <Users className="h-4 w-4" />,
  };

  const specLabels: Record<string, string> = {
    wingspan: "Wingspan",
    length: "Length",
    maxSpeed: "Max Speed",
    range: "Range",
    ceiling: "Service Ceiling",
    engines: "Engines",
    crew: "Crew",
    capacity: "Capacity",
  };

  const handleSubmitCorrection = () => {
    if (correctionText.trim() && onCorrection) {
      onCorrection(correctionText.trim());
    }
  };

  return (
    <div className="max-w-2xl mx-auto mt-6 space-y-4">
      {/* Main ID Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">{result.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1.5 text-muted-foreground">
                <Factory className="h-4 w-4" />
                <span>{result.manufacturer}</span>
                <span>&middot;</span>
                <MapPin className="h-4 w-4" />
                <span>{result.country}</span>
              </div>
            </div>
            <Badge className={confidenceColor[result.confidence]}>
              {result.confidence} confidence
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="secondary">{result.type}</Badge>
            <Badge variant="secondary">{result.role}</Badge>
            {result.variant && (
              <Badge variant="outline">{result.variant}</Badge>
            )}
            {result.natoReportingName && (
              <Badge variant="outline">
                NATO: {result.natoReportingName}
              </Badge>
            )}
            {result.operator && (
              <Badge variant="outline">{result.operator}</Badge>
            )}
            {result.livery && (
              <Badge variant="outline">Livery: {result.livery}</Badge>
            )}
          </div>
        </CardHeader>
        <Separator />
        <CardContent className="pt-4">
          <p className="text-sm leading-relaxed">{result.description}</p>

          {(result.firstFlight || result.inService) && (
            <div className="flex gap-6 mt-4 text-sm">
              {result.firstFlight && (
                <div>
                  <span className="text-muted-foreground">First flight:</span>{" "}
                  <span className="font-medium">{result.firstFlight}</span>
                </div>
              )}
              {result.inService && (
                <div>
                  <span className="text-muted-foreground">In service:</span>{" "}
                  <span className="font-medium">{result.inService}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Visual Cues */}
      {result.visualCues && (
        <Card className="bg-muted/30">
          <CardContent className="pt-5 pb-5">
            <div className="flex gap-3">
              <Eye className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">How I identified this</p>
                <p className="text-sm text-muted-foreground">
                  {result.visualCues}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Specs */}
      {specs.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Specifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {specs.map(([key, value]) => (
                <div key={key} className="flex items-start gap-2.5">
                  <div className="text-muted-foreground mt-0.5">
                    {specIcons[key] || <Plane className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {specLabels[key] || key}
                    </p>
                    <p className="text-sm font-medium">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fun Fact */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-5 pb-5">
          <div className="flex gap-3">
            <Lightbulb className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-primary mb-1">Fun Fact</p>
              <p className="text-sm">{result.funFact}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback */}
      {onCorrection && (
        <Card>
          <CardContent className="pt-5 pb-5">
            {feedback === null && (
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Did we get it right?</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/30"
                    onClick={() => setFeedback("correct")}
                  >
                    <ThumbsUp className="h-4 w-4" />
                    Correct
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/30"
                    onClick={() => setFeedback("wrong")}
                  >
                    <ThumbsDown className="h-4 w-4" />
                    Wrong
                  </Button>
                </div>
              </div>
            )}

            {feedback === "correct" && (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Check className="h-5 w-5" />
                <p className="text-sm font-medium">
                  Great, glad we nailed it!
                </p>
              </div>
            )}

            {feedback === "wrong" && (
              <div className="space-y-3">
                <p className="text-sm font-medium">
                  What aircraft is this? We&apos;ll re-identify with your input.
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={correctionText}
                    onChange={(e) => setCorrectionText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSubmitCorrection();
                    }}
                    placeholder="e.g. Boeing 737-800, F-22 Raptor, Cessna 172..."
                    className="flex-1 rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    disabled={isCorrecting}
                  />
                  <Button
                    size="sm"
                    className="gap-2"
                    onClick={handleSubmitCorrection}
                    disabled={!correctionText.trim() || isCorrecting}
                  >
                    {isCorrecting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {isCorrecting ? "Re-identifying..." : "Re-identify"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
