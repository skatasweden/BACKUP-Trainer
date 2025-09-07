import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Plus, Image } from "lucide-react";
import { useExercises } from "@/hooks/useExercises";
import { Badge } from "@/components/ui/badge";
import { useDraggable } from "@dnd-kit/core";

interface ExerciseItemProps {
  exercise: {
    id: string;
    title: string;
    cover_image_url?: string;
    category?: { name: string };
    child_category?: { name: string };
  };
}

function ExerciseItem({ exercise }: ExerciseItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `exercise-${exercise.id}`,
    data: {
      type: "exercise",
      exercise: exercise,
    },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={`hover:shadow-md transition-all cursor-grab active:cursor-grabbing ${
        isDragging ? 'opacity-50 shadow-lg' : ''
      }`}
      {...listeners}
      {...attributes}
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
            {exercise.cover_image_url ? (
              <img 
                src={exercise.cover_image_url} 
                alt={exercise.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Image className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{exercise.title}</h4>
            <div className="flex flex-wrap gap-1 mt-1">
              {exercise.category && (
                <Badge variant="secondary" className="text-xs">
                  {exercise.category.name}
                </Badge>
              )}
              {exercise.child_category && (
                <Badge variant="outline" className="text-xs">
                  {exercise.child_category.name}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ExerciseLibrary() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const { data: exercises, isLoading } = useExercises(selectedCategory, search);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök övningar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {exercises?.map((exercise) => (
            <ExerciseItem key={exercise.id} exercise={exercise} />
          ))}
        </div>

        {exercises?.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              Inga övningar hittades
            </p>
          </div>
        )}
      </div>
    </div>
  );
}