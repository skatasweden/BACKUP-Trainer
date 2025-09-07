import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { ExerciseCard } from './ExerciseCard';
import { ExerciseForm } from './ExerciseForm';
import { ExerciseBulkToolbar } from './ExerciseBulkToolbar';
import { ConfirmDeleteDialog } from './ConfirmDeleteDialog';
import { 
  Exercise, 
  useUpdateExercise, 
  useUpdateExercisesOrder,
  useDeleteExercise,
  useDeleteMultipleExercises,
  useBulkUpdateExercises
} from '@/hooks/useExercises';

interface ExerciseListProps {
  exercises: Exercise[];
  isLoading?: boolean;
  isSelectionMode?: boolean;
}

export function ExerciseList({ 
  exercises, 
  isLoading: isLoadingExercises,
  isSelectionMode = false
}: ExerciseListProps) {
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<Set<string>>(new Set());
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [exercisesToDelete, setExercisesToDelete] = useState<Exercise[]>([]);

  const updateExerciseMutation = useUpdateExercise();
  const updateOrderMutation = useUpdateExercisesOrder();
  const deleteExerciseMutation = useDeleteExercise();
  const deleteMultipleMutation = useDeleteMultipleExercises();
  const bulkUpdateMutation = useBulkUpdateExercises();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const activeExercises = exercises.filter(exercise => !exercise.is_archived);
  const archivedExercises = exercises.filter(exercise => exercise.is_archived);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = activeExercises.findIndex(exercise => exercise.id === active.id);
      const newIndex = activeExercises.findIndex(exercise => exercise.id === over?.id);

      const newOrder = arrayMove(activeExercises, oldIndex, newIndex);
      const updates = newOrder.map((exercise, index) => ({
        id: exercise.id,
        sort_order: index,
      }));

      updateOrderMutation.mutate(updates);
    }
  };

  const handleEdit = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setShowEditForm(true);
  };

  const handleToggleArchive = (exercise: Exercise) => {
    updateExerciseMutation.mutate({
      id: exercise.id,
      is_archived: !exercise.is_archived,
    });
  };

  const handleUpdateExercise = (data: any) => {
    if (editingExercise) {
      updateExerciseMutation.mutate({
        id: editingExercise.id,
        ...data,
      });
      setEditingExercise(null);
    }
  };

  const handleDelete = (exercise: Exercise) => {
    setExercisesToDelete([exercise]);
    setShowDeleteDialog(true);
  };

  const handleBulkDelete = () => {
    const exercisesToDel = exercises.filter(ex => selectedExerciseIds.has(ex.id));
    setExercisesToDelete(exercisesToDel);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (exercisesToDelete.length === 1) {
      deleteExerciseMutation.mutate(exercisesToDelete[0].id);
    } else {
      deleteMultipleMutation.mutate(exercisesToDelete.map(ex => ex.id));
    }
    setShowDeleteDialog(false);
    setExercisesToDelete([]);
    setSelectedExerciseIds(new Set());
  };

  const handleSelectAll = () => {
    if (selectedExerciseIds.size === exercises.length) {
      setSelectedExerciseIds(new Set());
    } else {
      setSelectedExerciseIds(new Set(exercises.map(ex => ex.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedExerciseIds(new Set());
  };

  const handleSelectionChange = (exerciseId: string, selected: boolean) => {
    const newSelection = new Set(selectedExerciseIds);
    if (selected) {
      newSelection.add(exerciseId);
    } else {
      newSelection.delete(exerciseId);
    }
    setSelectedExerciseIds(newSelection);
  };

  const handleBulkArchive = () => {
    const ids = Array.from(selectedExerciseIds);
    bulkUpdateMutation.mutate({ ids, updates: { is_archived: true } });
    setSelectedExerciseIds(new Set());
  };

  const handleBulkRestore = () => {
    const ids = Array.from(selectedExerciseIds);
    bulkUpdateMutation.mutate({ ids, updates: { is_archived: false } });
    setSelectedExerciseIds(new Set());
  };

  const isOperationLoading = isLoadingExercises || deleteExerciseMutation.isPending || 
    deleteMultipleMutation.isPending || bulkUpdateMutation.isPending;

  if (isOperationLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-64 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <>
        <ExerciseBulkToolbar
          exercises={exercises}
          selectedIds={selectedExerciseIds}
          onSelectAll={handleSelectAll}
          onClearSelection={handleClearSelection}
          onBulkArchive={handleBulkArchive}
          onBulkRestore={handleBulkRestore}
          onBulkDelete={handleBulkDelete}
          isLoading={isOperationLoading}
        />
      
      <div className="space-y-6">
        {activeExercises.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Aktiva övningar</h3>
            {selectedExerciseIds.size === 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
                modifiers={[restrictToVerticalAxis]}
              >
                <SortableContext
                  items={activeExercises.map(exercise => exercise.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {activeExercises.map(exercise => (
                      <ExerciseCard
                        key={exercise.id}
                        exercise={exercise}
                        onEdit={() => handleEdit(exercise)}
                        onToggleArchive={() => handleToggleArchive(exercise)}
                        onDelete={() => handleDelete(exercise)}
                        isSelectionMode={isSelectionMode}
                        isSelected={selectedExerciseIds.has(exercise.id)}
                        onSelectionChange={(selected) => handleSelectionChange(exercise.id, selected)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeExercises.map(exercise => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    onEdit={() => handleEdit(exercise)}
                    onToggleArchive={() => handleToggleArchive(exercise)}
                    onDelete={() => handleDelete(exercise)}
                     isSelectionMode={isSelectionMode}
                    isSelected={selectedExerciseIds.has(exercise.id)}
                    onSelectionChange={(selected) => handleSelectionChange(exercise.id, selected)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {archivedExercises.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Arkiverade övningar</h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {archivedExercises.map(exercise => (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onEdit={() => handleEdit(exercise)}
                  onToggleArchive={() => handleToggleArchive(exercise)}
                  onDelete={() => handleDelete(exercise)}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedExerciseIds.has(exercise.id)}
                  onSelectionChange={(selected) => handleSelectionChange(exercise.id, selected)}
                />
              ))}
            </div>
          </div>
        )}

        {exercises.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Inga övningar hittades</p>
          </div>
        )}
      </div>

      <ExerciseForm
        open={showEditForm}
        onOpenChange={setShowEditForm}
        title="Redigera övning"
        description="Uppdatera övningens information"
        initialData={editingExercise || undefined}
        onSubmit={handleUpdateExercise}
        isLoading={updateExerciseMutation.isPending}
      />

      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        exercises={exercisesToDelete}
        onConfirm={handleConfirmDelete}
        isLoading={deleteExerciseMutation.isPending || deleteMultipleMutation.isPending}
      />
    </>
  );
}