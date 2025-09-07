import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Video } from "lucide-react";
import { ImageUpload } from "@/components/workouts/ImageUpload";
import { useWorkouts, useWorkoutPlanItems, type Workout, type WorkoutPlanItem } from "@/hooks/useWorkouts";
import { WorkoutPlanItemVideoDialog } from "@/components/workouts/WorkoutPlanItemVideoDialog";
import { useBlocks } from "@/hooks/useBlocks";
import { useExercises } from "@/hooks/useExercises";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface SortablePlanItemProps {
  item: WorkoutPlanItem & { itemName?: string };
  onDelete: (id: string) => void;
  onUpdate: (id: string, content: string) => void;
  onVideoEdit: (item: WorkoutPlanItem & { itemName?: string }) => void;
}

function SortablePlanItem({ item, onDelete, onUpdate, onVideoEdit }: SortablePlanItemProps) {
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

  const getItemIcon = () => {
    switch (item.item_type) {
      case 'exercise': return '🏋️';
      case 'block': return '📦';
      case 'rest': return '⏸️';
      case 'info': return 'ℹ️';
      default: return '❓';
    }
  };

  const getItemTypeLabel = () => {
    switch (item.item_type) {
      case 'exercise': return 'Övning';
      case 'block': return 'Block';
      case 'rest': return 'Vila';
      case 'info': return 'Info';
      default: return 'Okänd';
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-2">
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab hover:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>
            
            <div className="flex items-center gap-2 flex-1">
              <span className="text-lg">{getItemIcon()}</span>
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {getItemTypeLabel()}
                  </Badge>
                  {item.itemName && (
                    <span className="font-medium">{item.itemName}</span>
                  )}
                </div>
                {(item.item_type === 'rest' || item.item_type === 'info') && (
                  <Textarea
                    value={item.content || ''}
                    onChange={(e) => onUpdate(item.id, e.target.value)}
                    placeholder={item.item_type === 'rest' ? 'Vila (t.ex. 30 sekunder)' : 'Skriv din information här...'}
                    className="mt-2 text-sm"
                    rows={2}
                  />
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onVideoEdit(item)}
                className={item.show_video ? "text-primary" : "text-muted-foreground"}
                title="Videoinställningar"
              >
                <Video className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(item.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
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

export default function WorkoutBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { workouts, updateWorkout } = useWorkouts();
  const { planItems, createPlanItem, updatePlanItem, deletePlanItem, updatePlanItemsOrder } = useWorkoutPlanItems(id!);
  const { blocks } = useBlocks();
  const exercises = useExercises();

  const [workout, setWorkout] = useState<Workout | null>(null);
  const [newItemType, setNewItemType] = useState<'exercise' | 'block' | 'rest' | 'info'>('exercise');
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [selectedPlanItem, setSelectedPlanItem] = useState<(WorkoutPlanItem & { itemName?: string }) | null>(null);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (workouts.data && id) {
      const foundWorkout = workouts.data.find(w => w.id === id);
      if (foundWorkout) {
        setWorkout(foundWorkout);
      }
    }
  }, [workouts.data, id]);

  const handleSave = async () => {
    if (!workout) return;
    
    try {
      await updateWorkout.mutateAsync({
        id: workout.id,
        title: workout.title,
        short_description: workout.short_description,
        long_description: workout.long_description,
        cover_image_url: workout.cover_image_url,
        video_url: workout.video_url,
        coach_id: null, // Allow workouts without requiring a user
      });
    } catch (error) {
      console.error("Failed to save workout:", error);
    }
  };

  const handleAddItem = async () => {
    if (!id) return;

    // Ensure we always get a valid sort_order number
    const currentItems = planItems.data || [];
    const maxOrder = currentItems.length > 0 
      ? Math.max(...currentItems.map(item => item.sort_order || 0))
      : 0;
    
    try {
      await createPlanItem.mutateAsync({
        workout_id: id,
        item_type: newItemType,
        item_id: (newItemType === 'exercise' || newItemType === 'block') && selectedItemId ? selectedItemId : null,
        content: null,
        sort_order: maxOrder + 1,
        video_url: null,
        show_video: false,
      });
      setSelectedItemId('');
    } catch (error) {
      console.error("Failed to add item:", error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await deletePlanItem.mutateAsync(itemId);
    } catch (error) {
      console.error("Failed to delete item:", error);
    }
  };

  const handleUpdateItemContent = async (itemId: string, content: string) => {
    try {
      await updatePlanItem.mutateAsync({
        id: itemId,
        content,
      });
    } catch (error) {
      console.error("Failed to update item:", error);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const items = planItems.data || [];
      const oldIndex = items.findIndex(item => item.id === active.id);
      const newIndex = items.findIndex(item => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);
      const updates = newItems.map((item, index) => ({
        id: item.id,
        sort_order: index + 1,
      }));

      updatePlanItemsOrder.mutate(updates);
    }
  };

  const handleVideoEdit = (item: WorkoutPlanItem & { itemName?: string }) => {
    setSelectedPlanItem(item);
    setVideoDialogOpen(true);
  };

  const handleVideoSave = async (videoUrl: string | null, showVideo: boolean) => {
    if (!selectedPlanItem) return;
    
    try {
      await updatePlanItem.mutateAsync({
        id: selectedPlanItem.id,
        video_url: videoUrl,
        show_video: showVideo,
      });
    } catch (error) {
      console.error("Failed to update video settings:", error);
    }
  };

  const getItemsWithNames = () => {
    return (planItems.data || []).map(item => {
      let itemName = '';
      
      if (item.item_type === 'exercise' && item.item_id) {
        const exercise = exercises.data?.find(e => e.id === item.item_id);
        itemName = exercise?.title || 'Övning inte hittad';
      } else if (item.item_type === 'block' && item.item_id) {
        const block = blocks.data?.find(b => b.id === item.item_id);
        itemName = block?.name || 'Block inte hittat';
      }
      
      return { ...item, itemName };
    });
  };

  if (workouts.isLoading || !workout) {
    return <div className="p-6">Laddar träningspass...</div>;
  }

  const itemsWithNames = getItemsWithNames();

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate('/coach/workouts')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tillbaka
            </Button>
            <h1 className="text-2xl font-bold">Redigera träningspass</h1>
          </div>
          <Button onClick={handleSave} disabled={updateWorkout.isPending}>
            <Save className="h-4 w-4 mr-2" />
            Spara
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Metadata Panel */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Metadata</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Titel</Label>
                  <Input
                    id="title"
                    value={workout.title}
                    onChange={(e) => setWorkout({...workout, title: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="short_description">Kort beskrivning (max 160 tecken)</Label>
                  <Textarea
                    id="short_description"
                    value={workout.short_description || ''}
                    onChange={(e) => setWorkout({...workout, short_description: e.target.value})}
                    maxLength={160}
                    rows={3}
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {(workout.short_description || '').length}/160 tecken
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="long_description">Lång beskrivning (Markdown tillåten)</Label>
                  <Textarea
                    id="long_description"
                    value={workout.long_description || ''}
                    onChange={(e) => setWorkout({...workout, long_description: e.target.value})}
                    rows={6}
                  />
                </div>
                
                <ImageUpload
                  currentImageUrl={workout.cover_image_url}
                  onImageChange={(url) => setWorkout({...workout, cover_image_url: url})}
                />
                
                <div>
                  <Label htmlFor="video_url">YouTube URL</Label>
                  <Input
                    id="video_url"
                    value={workout.video_url || ''}
                    onChange={(e) => setWorkout({...workout, video_url: e.target.value})}
                    placeholder="https://youtube.com/..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Plan Builder Panel */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Träningsplan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Add Item Controls */}
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label>Lägg till objekt</Label>
                    <Select value={newItemType} onValueChange={(value: any) => setNewItemType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exercise">Övning</SelectItem>
                        <SelectItem value="block">Block</SelectItem>
                        <SelectItem value="rest">Vila</SelectItem>
                        <SelectItem value="info">Information</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {(newItemType === 'exercise' || newItemType === 'block') && (
                    <div className="flex-1">
                      <Label>Välj {newItemType === 'exercise' ? 'övning' : 'block'}</Label>
                      <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                        <SelectTrigger>
                          <SelectValue placeholder={`Välj ${newItemType === 'exercise' ? 'övning' : 'block'}...`} />
                        </SelectTrigger>
                        <SelectContent>
                          {newItemType === 'exercise' && exercises.data?.map(exercise => (
                            <SelectItem key={exercise.id} value={exercise.id}>
                              {exercise.title}
                            </SelectItem>
                          ))}
                          {newItemType === 'block' && blocks.data?.map(block => (
                            <SelectItem key={block.id} value={block.id}>
                              {block.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleAddItem} 
                    disabled={createPlanItem.isPending || ((newItemType === 'exercise' || newItemType === 'block') && !selectedItemId)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Lägg till
                  </Button>
                </div>
                
                <Separator />
                
                {/* Plan Items List */}
                <div>
                  <Label className="text-base font-semibold">Träningsplan ({itemsWithNames.length} objekt)</Label>
                  <div className="mt-4">
                    {itemsWithNames.length > 0 ? (
                      <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                      >
                        <SortableContext
                          items={itemsWithNames.map(item => item.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {itemsWithNames.map((item) => (
                            <SortablePlanItem
                              key={item.id}
                              item={item}
                              onDelete={handleDeleteItem}
                              onUpdate={handleUpdateItemContent}
                              onVideoEdit={handleVideoEdit}
                            />
                          ))}
                        </SortableContext>
                      </DndContext>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        Inga objekt i träningsplanen än. Lägg till övningar, block, vila eller information ovan.
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <WorkoutPlanItemVideoDialog
        open={videoDialogOpen}
        onOpenChange={setVideoDialogOpen}
        planItem={selectedPlanItem}
        itemName={selectedPlanItem?.itemName}
        onSave={handleVideoSave}
      />
    </div>
  );
}