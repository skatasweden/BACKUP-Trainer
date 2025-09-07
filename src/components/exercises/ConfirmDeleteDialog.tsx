import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Exercise } from '@/hooks/useExercises';
import { Trash2 } from 'lucide-react';

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  exercises: Exercise[];
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  exercises,
  onConfirm,
  isLoading = false,
}: ConfirmDeleteDialogProps) {
  const isMultiple = exercises.length > 1;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <AlertDialogTitle>
                {isMultiple 
                  ? `Radera ${exercises.length} övningar permanent?`
                  : 'Radera övning permanent?'
                }
              </AlertDialogTitle>
              <AlertDialogDescription>
                Denna åtgärd kan inte ångras. Övningarna kommer att tas bort permanent från systemet.
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="max-h-60 overflow-y-auto">
          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">
              {isMultiple ? 'Övningar som kommer raderas:' : 'Övning som kommer raderas:'}
            </p>
            <div className="space-y-1">
              {exercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="flex items-center gap-2 p-2 bg-muted rounded-md"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium">{exercise.title}</p>
                    {exercise.short_description && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {exercise.short_description}
                      </p>
                    )}
                  </div>
                  {exercise.is_archived && (
                    <span className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                      Arkiverad
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>
            Avbryt
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isLoading ? 'Raderar...' : 'Radera permanent'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}