import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, GripVertical, Image, Target } from "lucide-react";
import { useBlockVariants, useBlockItems } from "@/hooks/useBlocks";
import { AddItemDialog } from "./AddItemDialog";
import { ProtocolSelectionDialog } from "./ProtocolSelectionDialog";
import { useToast } from "@/hooks/use-toast";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  useDroppable,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface VariantCanvasProps {
  blockId: string;
  activeVariant: string;
}

interface BlockItemComponentProps {
  item: any;
  onRemove: (id: string) => void;
}

function BlockItemComponent({ item, onRemove }: BlockItemComponentProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <Card ref={setNodeRef} style={style} className="border-dashed">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          {/* Exercise */}
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded bg-muted flex items-center justify-center">
              {item.exercise?.cover_image_url ? (
                <img 
                  src={item.exercise.cover_image_url} 
                  alt={item.exercise.title}
                  className="w-full h-full object-cover rounded"
                />
              ) : (
                <Image className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <span className="font-medium">{item.exercise?.title}</span>
          </div>

          {/* Protocol */}
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm">{item.protocol?.name}</span>
            <div className="flex gap-1">
              {item.protocol?.sets && (
                <Badge variant="secondary" className="text-xs">
                  {item.protocol.sets} sets
                </Badge>
              )}
              {item.protocol?.repetitions && (
                <Badge variant="secondary" className="text-xs">
                  {item.protocol.repetitions} reps
                </Badge>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function DroppableArea({ children, activeVariantId }: { children: React.ReactNode; activeVariantId?: string }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `variant-${activeVariantId}`,
    data: {
      type: "variant",
      variantId: activeVariantId,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-96 p-4 rounded-lg border-2 border-dashed transition-colors ${
        isOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
      }`}
    >
      {children}
    </div>
  );
}

export function VariantCanvas({ blockId, activeVariant }: VariantCanvasProps) {
  const { variants } = useBlockVariants(blockId);
  const activeVariantData = variants.data?.find(v => v.variant_label === activeVariant);
  const { items, addItem, updateItems, removeItem } = useBlockItems(activeVariantData?.id || "");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [protocolDialogOpen, setProtocolDialogOpen] = useState(false);
  const [pendingExercise, setPendingExercise] = useState<any>(null);
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Handle dropping exercise from library to canvas
    if (activeData?.type === "exercise" && overData?.type === "variant") {
      setPendingExercise(activeData.exercise);
      setProtocolDialogOpen(true);
      return;
    }

    // Handle reordering existing items
    if (!items.data) return;

    if (active.id !== over.id) {
      const oldIndex = items.data.findIndex(item => item.id === active.id);
      const newIndex = items.data.findIndex(item => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(items.data, oldIndex, newIndex);
        const updatedItems = newItems.map((item, index) => ({
          id: item.id,
          sort_order: index,
        }));

        updateItems.mutate(updatedItems);
      }
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeData = active.data.current;
    const overData = over.data.current;

    // Handle dropping exercise from library to canvas
    if (activeData?.type === "exercise" && overData?.type === "variant") {
      // This will trigger the protocol selection dialog
      return;
    }
  };

  const handleProtocolSelect = async (protocolId: string) => {
    if (!activeVariantData?.id || !pendingExercise) return;

    const nextSortOrder = items.data?.length || 0;
    
    try {
      await addItem.mutateAsync({
        variant_id: activeVariantData.id,
        exercise_id: pendingExercise.id,
        protocol_id: protocolId,
        sort_order: nextSortOrder,
      });
      
      toast({
        title: "Övning tillagd",
        description: `${pendingExercise.title} har lagts till i variant ${activeVariant}`,
      });
    } catch (error) {
      console.error("Failed to add item:", error);
      toast({
        title: "Fel",
        description: "Kunde inte lägga till övningen",
        variant: "destructive",
      });
    } finally {
      setPendingExercise(null);
    }
  };

  const handleRemove = async (itemId: string) => {
    try {
      await removeItem.mutateAsync(itemId);
    } catch (error) {
      console.error("Failed to remove item:", error);
    }
  };

  if (!activeVariantData) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Ingen variant vald</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Variant {activeVariant}</h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {items.data?.length || 0} övningar
            </Badge>
            <AddItemDialog variantId={activeVariantData.id} />
          </div>
        </div>

        <DroppableArea activeVariantId={activeVariantData.id}>
          {items.data && items.data.length > 0 ? (
            <SortableContext items={items.data.map(item => item.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {items.data.map((item) => (
                  <BlockItemComponent
                    key={item.id}
                    item={item}
                    onRemove={handleRemove}
                  />
                ))}
              </div>
            </SortableContext>
          ) : (
            <div className="flex items-center justify-center h-32 text-center">
              <div>
                <p className="text-muted-foreground mb-2">
                  Dra övningar från biblioteket hit eller använd knappen "Lägg till övning"
                </p>
                <p className="text-sm text-muted-foreground">
                  Du behöver både en övning och ett protokoll för att skapa en träningskomponent
                </p>
              </div>
            </div>
          )}
        </DroppableArea>
      </div>

      <ProtocolSelectionDialog
        open={protocolDialogOpen}
        onOpenChange={setProtocolDialogOpen}
        onSelectProtocol={handleProtocolSelect}
        exerciseTitle={pendingExercise?.title || ""}
      />
    </>
  );
}