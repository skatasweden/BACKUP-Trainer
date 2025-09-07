import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Video, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ProgramItemVideoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  programItem: any;
  workoutTitle?: string;
  onSave: (videoUrl: string | null, showVideo: boolean) => void;
}

function extractYouTubeVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export function ProgramItemVideoDialog({ 
  open, 
  onOpenChange, 
  programItem, 
  workoutTitle,
  onSave 
}: ProgramItemVideoDialogProps) {
  const [showVideo, setShowVideo] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(true);

  useEffect(() => {
    if (programItem) {
      setShowVideo(programItem.show_video || false);
      setVideoUrl(programItem.video_url || "");
    }
  }, [programItem]);

  useEffect(() => {
    if (videoUrl) {
      const videoId = extractYouTubeVideoId(videoUrl);
      setIsValidUrl(!!videoId);
    } else {
      setIsValidUrl(true);
    }
  }, [videoUrl]);

  const handleSave = () => {
    if (showVideo && videoUrl && !isValidUrl) {
      return;
    }
    onSave(showVideo && videoUrl ? videoUrl : null, showVideo);
    onOpenChange(false);
  };

  const videoId = videoUrl ? extractYouTubeVideoId(videoUrl) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Video-inställningar för träningspass
          </DialogTitle>
          <DialogDescription>
            Konfigurera video för: {workoutTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Visa video för detta pass</Label>
              <p className="text-sm text-muted-foreground">
                Aktivera för att visa en specifik video för detta program-item
              </p>
            </div>
            <Switch
              checked={showVideo}
              onCheckedChange={setShowVideo}
            />
          </div>

          {showVideo && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="video_url">YouTube URL</Label>
                <Input
                  id="video_url"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=... eller https://youtu.be/..."
                  className={!isValidUrl ? "border-red-500" : ""}
                />
                {!isValidUrl && (
                  <Alert className="mt-2" variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Ogiltig YouTube URL. Använd formatet: https://www.youtube.com/watch?v=VIDEO_ID eller https://youtu.be/VIDEO_ID
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {videoId && isValidUrl && (
                <div>
                  <Label>Förhandsvisning</Label>
                  <Card className="p-4">
                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="w-full h-full"
                      />
                    </div>
                  </Card>
                </div>
              )}

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Tips:</strong> Denna video kommer att visas ovanför träningspassets beskrivning när atleter öppnar passet. 
                  Du kan ha olika videos för samma träningspass beroende på var i programmet det befinner sig.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Avbryt
          </Button>
          <Button 
            onClick={handleSave}
            disabled={showVideo && videoUrl && !isValidUrl}
          >
            Spara inställningar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}