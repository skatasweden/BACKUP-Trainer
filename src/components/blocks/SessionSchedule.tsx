import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Minus, Save } from "lucide-react";
import { useSessionSchedule, useBlockVariants } from "@/hooks/useBlocks";

interface SessionScheduleProps {
  blockId: string;
}

export function SessionSchedule({ blockId }: SessionScheduleProps) {
  const { schedule, updateSchedule } = useSessionSchedule(blockId);
  const { variants } = useBlockVariants(blockId);
  const [sessionCount, setSessionCount] = useState(8);
  const [localSchedule, setLocalSchedule] = useState<Array<{ session_number: number; variant_label: string }>>([]);

  // Initialize local schedule
  useEffect(() => {
    if (schedule.data && schedule.data.length > 0) {
      setLocalSchedule(schedule.data);
      setSessionCount(Math.max(schedule.data.length, 8));
    } else {
      // Create default schedule with pattern A,A,B,A,B,B,A,B
      const defaultPattern = ['A', 'A', 'B', 'A', 'B', 'B', 'A', 'B'];
      const defaultSchedule = Array.from({ length: sessionCount }, (_, i) => ({
        session_number: i + 1,
        variant_label: defaultPattern[i % defaultPattern.length] || 'A',
      }));
      setLocalSchedule(defaultSchedule);
    }
  }, [schedule.data, sessionCount]);

  const availableVariants = variants.data?.map(v => v.variant_label) || ['A'];

  const handleSessionCountChange = (newCount: number) => {
    if (newCount < 1 || newCount > 20) return;
    
    setSessionCount(newCount);
    
    if (newCount > localSchedule.length) {
      // Add new sessions with default variant
      const newSessions = Array.from({ length: newCount - localSchedule.length }, (_, i) => ({
        session_number: localSchedule.length + i + 1,
        variant_label: 'A',
      }));
      setLocalSchedule([...localSchedule, ...newSessions]);
    } else {
      // Remove excess sessions
      setLocalSchedule(localSchedule.slice(0, newCount));
    }
  };

  const handleVariantChange = (sessionNumber: number, variantLabel: string) => {
    setLocalSchedule(prev => 
      prev.map(session => 
        session.session_number === sessionNumber 
          ? { ...session, variant_label: variantLabel }
          : session
      )
    );
  };

  const handleSave = async () => {
    try {
      await updateSchedule.mutateAsync(localSchedule);
    } catch (error) {
      console.error("Failed to save schedule:", error);
    }
  };

  const isChanged = JSON.stringify(localSchedule) !== JSON.stringify(schedule.data || []);

  return (
    <div className="space-y-4">
      {/* Session Count Controls */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Antal pass:</span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSessionCountChange(sessionCount - 1)}
            disabled={sessionCount <= 1}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="text-sm font-mono w-8 text-center">{sessionCount}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleSessionCountChange(sessionCount + 1)}
            disabled={sessionCount >= 20}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
        {localSchedule.map((session) => (
          <div key={session.session_number} className="flex items-center gap-2">
            <span className="text-xs font-mono w-12">Pass {session.session_number}:</span>
            <Select
              value={session.variant_label}
              onValueChange={(value) => handleVariantChange(session.session_number, value)}
            >
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableVariants.map((variant) => (
                  <SelectItem key={variant} value={variant} className="text-xs">
                    Variant {variant}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>

      {/* Quick Pattern Buttons */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-muted-foreground">Snabbmönster:</span>
        <div className="flex flex-wrap gap-1">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => {
              const pattern = localSchedule.map((_, i) => ({
                session_number: i + 1,
                variant_label: 'A',
              }));
              setLocalSchedule(pattern);
            }}
          >
            Alla A
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => {
              const pattern = localSchedule.map((_, i) => ({
                session_number: i + 1,
                variant_label: i % 2 === 0 ? 'A' : 'B',
              }));
              setLocalSchedule(pattern);
            }}
          >
            A/B växling
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => {
              const patternArray = ['A', 'A', 'B', 'A', 'B', 'B', 'A', 'B'];
              const pattern = localSchedule.map((_, i) => ({
                session_number: i + 1,
                variant_label: patternArray[i % patternArray.length] || 'A',
              }));
              setLocalSchedule(pattern);
            }}
          >
            A,A,B,A,B,B,A,B
          </Button>
        </div>
      </div>

      {/* Save Button */}
      {isChanged && (
        <Button 
          onClick={handleSave} 
          disabled={updateSchedule.isPending}
          size="sm"
          className="w-full"
        >
          <Save className="h-3 w-3 mr-2" />
          {updateSchedule.isPending ? "Sparar..." : "Spara schema"}
        </Button>
      )}
    </div>
  );
}