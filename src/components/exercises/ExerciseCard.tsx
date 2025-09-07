import { useState } from 'react';
import { CSS } from '@dnd-kit/utilities';
import { useSortable } from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Exercise } from '@/hooks/useExercises';
import {
  GripVertical,
  Edit,
  Archive,
  ArchiveRestore,
  ExternalLink,
  Image as ImageIcon,
  Trash2,
} from 'lucide-react';

interface ExerciseCardProps {
  exercise: Exercise;
  onEdit: () => void;
  onToggleArchive: () => void;
  onDelete?: () => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onSelectionChange?: (selected: boolean) => void;
}

export function ExerciseCard({
  exercise,
  onEdit,
  onToggleArchive,
  onDelete,
  isSelectionMode = false,
  isSelected = false,
  onSelectionChange,
}: ExerciseCardProps) {
  const [imageError, setImageError] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: exercise.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`card-elevated transition-all duration-200 ${
        exercise.is_archived ? 'opacity-60' : ''
      } ${isSelected ? 'ring-2 ring-primary bg-primary/5' : ''}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {isSelectionMode && (
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={onSelectionChange}
                  className="shrink-0"
                />
              )}
              {!isSelectionMode && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="cursor-grab active:cursor-grabbing p-1 h-auto"
                  {...attributes}
                  {...listeners}
                >
                  <GripVertical className="h-4 w-4" />
                </Button>
              )}
              <h3 className="font-semibold text-foreground truncate">
                {exercise.title}
              </h3>
            </div>

            {exercise.short_description && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {exercise.short_description}
              </p>
            )}

            <div className="flex flex-wrap gap-1 mb-2">
              {exercise.categories && (
                <Badge variant="secondary" className="text-xs">
                  {exercise.categories.name}
                </Badge>
              )}
              {exercise.child_categories && (
                <Badge variant="outline" className="text-xs">
                  {exercise.child_categories.name}
                </Badge>
              )}
            </div>
          </div>

          {!isSelectionMode && (
            <div className="flex items-start gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-8 w-8 p-0"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleArchive}
                className="h-8 w-8 p-0"
              >
                {exercise.is_archived ? (
                  <ArchiveRestore className="h-4 w-4" />
                ) : (
                  <Archive className="h-4 w-4" />
                )}
              </Button>
              {onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="space-y-3">
          {exercise.cover_image_url && !imageError && (
            <div className="relative">
              <img
                src={exercise.cover_image_url}
                alt={exercise.title}
                className="w-full h-32 object-cover rounded-md border"
                onError={() => setImageError(true)}
              />
            </div>
          )}

          {(!exercise.cover_image_url || imageError) && (
            <div className="flex items-center justify-center h-32 bg-muted rounded-md border border-dashed">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
          )}

          <div className="flex items-center justify-between">
            {exercise.youtube_url && (
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
                onClick={() => window.open(exercise.youtube_url, '_blank')}
              >
                <ExternalLink className="h-4 w-4" />
                YouTube
              </Button>
            )}

            {exercise.long_description && (
              <Badge variant="outline" className="text-xs">
                Detaljerad instruktion
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}