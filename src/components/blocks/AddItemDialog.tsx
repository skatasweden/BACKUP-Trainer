import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useExercises } from "@/hooks/useExercises";
import { useProtocols } from "@/hooks/useProtocols";
import { useBlockItems } from "@/hooks/useBlocks";

interface AddItemDialogProps {
  variantId: string;
}

export function AddItemDialog({ variantId }: AddItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<string>("");
  const [selectedProtocol, setSelectedProtocol] = useState<string>("");
  
  const { data: exercises } = useExercises();
  const { protocols } = useProtocols();
  const { addItem, items } = useBlockItems(variantId);

  const handleAdd = async () => {
    if (!selectedExercise || !selectedProtocol) return;

    const nextSortOrder = items.data?.length || 0;
    
    try {
      await addItem.mutateAsync({
        variant_id: variantId,
        exercise_id: selectedExercise,
        protocol_id: selectedProtocol,
        sort_order: nextSortOrder,
      });
      
      setSelectedExercise("");
      setSelectedProtocol("");
      setOpen(false);
    } catch (error) {
      console.error("Failed to add item:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Lägg till övning
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lägg till övning + protokoll</DialogTitle>
          <DialogDescription>
            Välj en övning och ett protokoll för att skapa en träningskomponent.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Övning</label>
            <Select value={selectedExercise} onValueChange={setSelectedExercise}>
              <SelectTrigger>
                <SelectValue placeholder="Välj övning" />
              </SelectTrigger>
              <SelectContent>
                {exercises?.map((exercise) => (
                  <SelectItem key={exercise.id} value={exercise.id}>
                    {exercise.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium">Protokoll</label>
            <Select value={selectedProtocol} onValueChange={setSelectedProtocol}>
              <SelectTrigger>
                <SelectValue placeholder="Välj protokoll" />
              </SelectTrigger>
              <SelectContent>
                {protocols.data?.map((protocol) => (
                  <SelectItem key={protocol.id} value={protocol.id}>
                    {protocol.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Avbryt
            </Button>
            <Button 
              onClick={handleAdd}
              disabled={!selectedExercise || !selectedProtocol || addItem.isPending}
            >
              {addItem.isPending ? "Lägger till..." : "Lägg till"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}