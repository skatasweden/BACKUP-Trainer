import { useState, useMemo } from "react";
import { useWorkouts } from "@/hooks/useWorkouts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus } from "lucide-react";

interface WorkoutSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectWorkout: (workoutId: string) => void;
  existingWorkoutIds: string[];
}

export function WorkoutSelector({ 
  open, 
  onOpenChange, 
  onSelectWorkout, 
  existingWorkoutIds 
}: WorkoutSelectorProps) {
  const { workouts } = useWorkouts();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredWorkouts = useMemo(() => {
    if (!workouts.data) return [];
    
    return workouts.data
      .filter(workout => 
        workout.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        workout.short_description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [workouts.data, searchQuery]);

  const handleSelectWorkout = (workoutId: string) => {
    onSelectWorkout(workoutId);
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Välj träningspass</DialogTitle>
          <DialogDescription>
            Sök och välj träningspass att lägga till i programmet
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 overflow-hidden">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök träningspass..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Workouts List */}
          <div className="flex-1 overflow-y-auto space-y-3">
            {workouts.isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Laddar träningspass...
              </div>
            ) : filteredWorkouts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? 
                  "Inga träningspass matchade din sökning." : 
                  "Inga tillgängliga träningspass att lägga till."
                }
              </div>
            ) : (
              filteredWorkouts.map((workout) => (
                <Card key={workout.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {workout.cover_image_url && (
                        <img
                          src={workout.cover_image_url}
                          alt={workout.title}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-base">{workout.title}</h3>
                        {workout.short_description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {workout.short_description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            Träningspass
                          </Badge>
                          {workout.video_url && (
                            <Badge variant="outline" className="text-xs">
                              Video
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => handleSelectWorkout(workout.id)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Lägg till
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}