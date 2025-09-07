import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Eye, Settings, Trash2, Play } from "lucide-react";
import { useWorkouts } from "@/hooks/useWorkouts";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface WorkoutCardProps {
  workout: {
    id: string;
    title: string;
    short_description: string | null;
    cover_image_url: string | null;
    video_url: string | null;
    created_at: string;
    updated_at: string;
  };
  onEdit: () => void;
  onDelete: () => void;
}

function WorkoutCard({ workout, onEdit, onDelete }: WorkoutCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        {workout.cover_image_url && (
          <div className="w-full h-32 bg-muted rounded-md mb-3 overflow-hidden">
            <img 
              src={workout.cover_image_url} 
              alt={workout.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-semibold line-clamp-2">
              {workout.title}
            </CardTitle>
          </div>
          
          <div className="flex items-center gap-1 ml-2">
            {workout.video_url && (
              <Badge variant="secondary" className="text-xs">
                <Play className="h-3 w-3 mr-1" />
                Video
              </Badge>
            )}
          </div>
        </div>
        
        {workout.short_description && (
          <p className="text-sm text-muted-foreground line-clamp-3 mt-2">
            {workout.short_description}
          </p>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between mb-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Settings className="h-4 w-4 mr-1" />
            Redigera
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => e.stopPropagation()}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Ta bort träningspass</AlertDialogTitle>
                <AlertDialogDescription>
                  Är du säker på att du vill ta bort "{workout.title}"? 
                  Denna åtgärd kan inte ångras.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Ta bort
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Skapad: {format(new Date(workout.created_at), "d MMM yyyy", { locale: sv })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CoachWorkouts() {
  const [searchQuery, setSearchQuery] = useState("");
  const { workouts, createWorkout, deleteWorkout } = useWorkouts();
  const navigate = useNavigate();

  const handleCreateWorkout = async () => {
    try {
      const newWorkout = await createWorkout.mutateAsync({
        coach_id: null, // Will be set by RLS
        title: "Nytt träningspass",
        short_description: null,
        long_description: null,
        cover_image_url: null,
        video_url: null,
        is_archived: false,
      });
      navigate(`/coach/workouts/builder/${newWorkout.id}`);
    } catch (error) {
      console.error("Failed to create workout:", error);
    }
  };

  const handleDelete = async (workoutId: string) => {
    try {
      await deleteWorkout.mutateAsync(workoutId);
    } catch (error) {
      console.error("Failed to delete workout:", error);
    }
  };

  const filteredWorkouts = workouts.data?.filter(workout =>
    workout.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    workout.short_description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  if (workouts.isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Träningspass</h1>
          </div>
          <div className="text-center py-8">Laddar träningspass...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Träningspass</h1>
          <Button onClick={handleCreateWorkout} disabled={createWorkout.isPending}>
            <Plus className="h-4 w-4 mr-2" />
            Skapa träningspass
          </Button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Sök träningspass..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWorkouts.map((workout) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              onEdit={() => navigate(`/coach/workouts/builder/${workout.id}`)}
              onDelete={() => handleDelete(workout.id)}
            />
          ))}
        </div>

        {filteredWorkouts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              {searchQuery ? "Inga träningspass matchade din sökning." : "Inga träningspass skapade än."}
            </div>
            {!searchQuery && (
              <Button onClick={handleCreateWorkout} className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Skapa ditt första träningspass
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}