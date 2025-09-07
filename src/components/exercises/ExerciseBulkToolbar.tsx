import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Exercise } from '@/hooks/useExercises';
import { 
  X, 
  Trash2, 
  Archive, 
  ArchiveRestore,
  CheckSquare
} from 'lucide-react';

interface ExerciseBulkToolbarProps {
  exercises: Exercise[];
  selectedIds: Set<string>;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkArchive: () => void;
  onBulkRestore: () => void;
  onBulkDelete: () => void;
  isLoading?: boolean;
}

export function ExerciseBulkToolbar({
  exercises,
  selectedIds,
  onSelectAll,
  onClearSelection,
  onBulkArchive,
  onBulkRestore,
  onBulkDelete,
  isLoading = false,
}: ExerciseBulkToolbarProps) {
  const selectedExercises = exercises.filter(ex => selectedIds.has(ex.id));
  const allSelected = exercises.length > 0 && selectedIds.size === exercises.length;
  const hasArchived = selectedExercises.some(ex => ex.is_archived);
  const hasActive = selectedExercises.some(ex => !ex.is_archived);

  return (
    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border mb-4">
      <div className="flex items-center gap-4">
        <Checkbox
          checked={allSelected}
          onCheckedChange={onSelectAll}
          disabled={isLoading}
        />
        <span className="text-sm font-medium">
          Välj alla ({exercises.length})
        </span>
        {selectedIds.size > 0 && (
          <Badge variant="secondary">
            {selectedIds.size} valda
          </Badge>
        )}
      </div>
      
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2">
          {hasArchived && (
            <Button
              size="sm"
              variant="outline"
              onClick={onBulkRestore}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <ArchiveRestore className="h-4 w-4" />
              Återställ
            </Button>
          )}
          
          {hasActive && (
            <Button
              size="sm"
              variant="outline"
              onClick={onBulkArchive}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <Archive className="h-4 w-4" />
              Arkivera
            </Button>
          )}
          
          <Button
            size="sm"
            variant="destructive"
            onClick={onBulkDelete}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Radera
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={onClearSelection}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            Avbryt
          </Button>
        </div>
      )}
    </div>
  );
}