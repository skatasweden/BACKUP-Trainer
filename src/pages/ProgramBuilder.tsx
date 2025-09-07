import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Plus, GripVertical, Trash2, Copy, Video } from "lucide-react";
import { usePrograms, useProgramItems, type Program } from "@/hooks/usePrograms";
import { useWorkouts } from "@/hooks/useWorkouts";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { WorkoutSelector } from "@/components/programs/WorkoutSelector";
import { ProgramItemVideoDialog } from "@/components/programs/ProgramItemVideoDialog";

interface SortableProgramWorkoutProps {
  item: any;
  index: number;
  onDelete: (id: string) => void;
  onDuplicate: (workoutId: string) => void;
  onVideoEdit: (item: any) => void;
}

function SortableProgramWorkout({ item, index, onDelete, onDuplicate, onVideoEdit }: SortableProgramWorkoutProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const workout = item.workouts;

  return (
    <div ref={setNodeRef} style={style} className="mb-3">
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab hover:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="flex items-center gap-3 flex-1">
              {workout?.cover_image_url && (
                <img
                  src={workout.cover_image_url}
                  alt={workout.title}
                  className="w-12 h-12 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h4 className="font-semibold">{workout?.title || 'Träningspass ej hittat'}</h4>
                {workout?.short_description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {workout.short_description}
                  </p>
                )}
              </div>
              <Badge variant="outline" className="text-xs">
                Pass {index + 1}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onVideoEdit(item)}
                className={item.show_video ? "text-blue-600 hover:text-blue-700" : "text-muted-foreground hover:text-foreground"}
                title="Redigera video-inställningar"
              >
                <Video className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDuplicate(item.workout_id)}
                className="text-muted-foreground hover:text-foreground"
                title="Duplicera träningspass"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(item.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                title="Ta bort träningspass"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ProgramBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { programs, updateProgram } = usePrograms();
  const { programItems, createProgramItem, deleteProgramItem, updateProgramItem, updateProgramItemsOrder } = useProgramItems(id!);
  const { workouts } = useWorkouts();

  const [program, setProgram] = useState<Program | null>(null);
  const [showWorkoutSelector, setShowWorkoutSelector] = useState(false);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [selectedProgramItem, setSelectedProgramItem] = useState<any>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (programs.data && id) {
      const foundProgram = programs.data.find(p => p.id === id);
      if (foundProgram) {
        setProgram(foundProgram);
      }
    }
  }, [programs.data, id]);

  const handleSave = async () => {
    if (!program) return;
    
    try {
      await updateProgram.mutateAsync({
        id: program.id,
        name: program.name,
        short_description: program.short_description,
        long_description: program.long_description,
        cover_image_url: program.cover_image_url,
        video_url: program.video_url,
        currency: program.currency,
        billing_interval: program.billing_interval,
        billing_interval_count: program.billing_interval_count,
      });
      toast({
        title: "Program sparat",
        description: "Programmet har uppdaterats framgångsrikt.",
      });
    } catch (error) {
      console.error("Failed to save program:", error);
      toast({
        title: "Fel",
        description: "Kunde inte spara programmet. Försök igen.",
        variant: "destructive",
      });
    }
  };

  const handleAddWorkout = async (workoutId: string) => {
    if (!id) return;

    const currentItems = programItems.data || [];
    const maxOrder = currentItems.length > 0 
      ? Math.max(...currentItems.map(item => item.sort_order || 0))
      : 0;
    
    try {
      await createProgramItem.mutateAsync({
        program_id: id,
        workout_id: workoutId,
        sort_order: maxOrder + 1,
      });
      setShowWorkoutSelector(false);
      toast({
        title: "Träningspass tillagt",
        description: "Träningspasset har lagts till i programmet.",
      });
    } catch (error) {
      console.error("Failed to add workout:", error);
      toast({
        title: "Fel",
        description: "Kunde inte lägga till träningspasset. Försök igen.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteWorkout = async (itemId: string) => {
    try {
      await deleteProgramItem.mutateAsync(itemId);
      toast({
        title: "Träningspass borttaget",
        description: "Träningspasset har tagits bort från programmet.",
      });
    } catch (error) {
      console.error("Failed to delete workout:", error);
      toast({
        title: "Fel",
        description: "Kunde inte ta bort träningspasset. Försök igen.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateWorkout = async (workoutId: string) => {
    if (!id) return;

    const currentItems = programItems.data || [];
    const maxOrder = currentItems.length > 0 
      ? Math.max(...currentItems.map(item => item.sort_order || 0))
      : 0;
    
    try {
      await createProgramItem.mutateAsync({
        program_id: id,
        workout_id: workoutId,
        sort_order: maxOrder + 1,
      });
      toast({
        title: "Träningspass duplicerat",
        description: "Träningspasset har lagts till igen i programmet.",
      });
    } catch (error) {
      console.error("Failed to duplicate workout:", error);
      toast({
        title: "Fel",
        description: "Kunde inte duplicera träningspasset. Försök igen.",
        variant: "destructive",
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const items = programItems.data || [];
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      const updates = newItems.map((item, index) => ({
        id: item.id,
        sort_order: index + 1,
      }));

      updateProgramItemsOrder.mutate(updates);
    }
  };

  const handleVideoEdit = (item: any) => {
    setSelectedProgramItem(item);
    setShowVideoDialog(true);
  };

  const handleVideoSave = async (videoUrl: string | null, showVideo: boolean) => {
    if (!selectedProgramItem) return;
    
    // Enhanced debug logging
    console.debug('Updating program_item', {
      id: selectedProgramItem?.id,
      program_id: selectedProgramItem?.program_id,
      workout_id: selectedProgramItem?.workout_id,
      video_url: videoUrl,
      show_video: showVideo,
    });
    
    try {
      await updateProgramItem.mutateAsync({
        id: selectedProgramItem.id,
        video_url: videoUrl,
        show_video: showVideo,
      });
      console.debug("Video settings saved successfully");
      toast({
        title: "Video-inställningar sparade",
        description: "Video-inställningarna har uppdaterats framgångsrikt.",
      });
    } catch (error) {
      console.error("Error saving video settings:", error);
      toast({
        title: "Fel",
        description: "Kunde inte spara video-inställningarna. Försök igen.",
        variant: "destructive",
      });
    }
  };

  if (programs.isLoading || !program) {
    return <div className="p-6">Laddar program...</div>;
  }

  const programWorkouts = programItems.data || [];

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/coach/programs')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tillbaka
            </Button>
            <h1 className="text-2xl font-bold">Redigera program</h1>
          </div>
          <Button onClick={handleSave} disabled={updateProgram.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Spara
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Metadata Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Program Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="name">Programnamn</Label>
                  <Input
                    id="name"
                    value={program.name}
                    onChange={(e) => setProgram({...program, name: e.target.value})}
                    placeholder="T.ex. Nybörjarprogram 8 veckor"
                  />
                </div>
                
                <div>
                  <Label htmlFor="short_description">Kort beskrivning (max 160 tecken)</Label>
                  <Textarea
                    id="short_description"
                    value={program.short_description || ''}
                    onChange={(e) => setProgram({...program, short_description: e.target.value})}
                    maxLength={160}
                    rows={3}
                    placeholder="En kort beskrivning av programmet..."
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {(program.short_description || '').length}/160 tecken
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="long_description">Detaljerad beskrivning (Markdown tillåten)</Label>
                  <Textarea
                    id="long_description"
                    value={program.long_description || ''}
                    onChange={(e) => setProgram({...program, long_description: e.target.value})}
                    rows={6}
                    placeholder="Detaljerad beskrivning av programmet, vad det omfattar, målgrupp, etc..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="cover_image_url">Omslagsbild URL</Label>
                  <Input
                    id="cover_image_url"
                    value={program.cover_image_url || ''}
                    onChange={(e) => setProgram({...program, cover_image_url: e.target.value})}
                    placeholder="https://..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="video_url">YouTube URL</Label>
                  <Input
                    id="video_url"
                    value={program.video_url || ''}
                    onChange={(e) => setProgram({...program, video_url: e.target.value})}
                    placeholder="https://youtube.com/..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Program Builder Panel */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Träningspass i program
                  <Button onClick={() => setShowWorkoutSelector(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Lägg till pass
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Program Workouts List */}
                <div>
                  {programWorkouts.length > 0 ? (
                    <div className="space-y-2">
                      <Label className="text-base font-semibold">
                        Träningspass ({programWorkouts.length} st)
                      </Label>
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={programWorkouts.map(item => item.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {programWorkouts.map((item, index) => (
                            <SortableProgramWorkout
                              key={item.id}
                              item={item}
                              index={index}
                              onDelete={handleDeleteWorkout}
                              onDuplicate={handleDuplicateWorkout}
                              onVideoEdit={handleVideoEdit}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <div className="mb-4">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                          <Plus className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Inga träningspass än</h3>
                        <p className="text-sm">
                          Lägg till träningspass för att skapa ditt program
                        </p>
                      </div>
                      <Button onClick={() => setShowWorkoutSelector(true)}>
                        Lägg till första passet
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Workout Selector Modal */}
      <WorkoutSelector 
        open={showWorkoutSelector}
        onOpenChange={setShowWorkoutSelector}
        onSelectWorkout={handleAddWorkout}
        existingWorkoutIds={[]}
      />

      {/* Video Settings Dialog */}
      <ProgramItemVideoDialog
        open={showVideoDialog}
        onOpenChange={setShowVideoDialog}
        programItem={selectedProgramItem}
        workoutTitle={selectedProgramItem?.workouts?.title}
        onSave={handleVideoSave}
      />
    </div>
  );
}