import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Edit2, Trash2, Save, X, Settings, Target, Image, Archive, Calendar } from "lucide-react";
import { useBlock, useUpdateBlock, useDeleteBlock, useBlockVariants, useSessionSchedule } from "@/hooks/useBlocks";
import { useToast } from "@/components/ui/use-toast";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface BlockDetailsDialogProps {
  blockId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BlockDetailsDialog({ blockId, open, onOpenChange }: BlockDetailsDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editRounds, setEditRounds] = useState(1);

  const { data: block, isLoading } = useBlock(blockId || "");
  const { variants } = useBlockVariants(blockId || "");
  const { schedule } = useSessionSchedule(blockId || "");
  const updateBlock = useUpdateBlock();
  const deleteBlock = useDeleteBlock();
  const { toast } = useToast();

  useEffect(() => {
    if (block) {
      setEditName(block.name);
      setEditDescription(block.description || "");
      setEditRounds(block.rounds || 1);
    }
  }, [block]);

  const handleSave = async () => {
    if (!blockId) return;

    try {
      await updateBlock.mutateAsync({
        id: blockId,
        name: editName,
        description: editDescription,
        rounds: editRounds,
      });
      setIsEditing(false);
      toast({
        title: "Block uppdaterat",
        description: "Dina ändringar har sparats.",
      });
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte spara ändringar.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!blockId) return;

    try {
      await deleteBlock.mutateAsync(blockId);
      onOpenChange(false);
      toast({
        title: "Block borttaget",
        description: "Blocket har tagits bort permanent.",
      });
    } catch (error) {
      toast({
        title: "Fel",
        description: "Kunde inte ta bort block.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    if (block) {
      setEditName(block.name);
      setEditDescription(block.description || "");
      setEditRounds(block.rounds || 1);
    }
    setIsEditing(false);
  };

  if (!blockId || isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-6 bg-muted rounded w-1/2 mb-2"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!block) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-2">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Block namn"
                      className="text-lg font-semibold"
                    />
                  </div>
                ) : (
                  <DialogTitle className="text-xl">{block.name}</DialogTitle>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {block.is_archived && (
                  <Badge variant="secondary">
                    <Archive className="h-3 w-3 mr-1" />
                    Arkiverad
                  </Badge>
                )}
                
                {isEditing ? (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCancel}>
                      <X className="h-4 w-4 mr-1" />
                      Avbryt
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={updateBlock.isPending}>
                      <Save className="h-4 w-4 mr-1" />
                      {updateBlock.isPending ? "Sparar..." : "Spara"}
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowDeleteAlert(true)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
            
            {isEditing ? (
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Beskrivning av blocket..."
                rows={2}
              />
            ) : (
              <DialogDescription>
                {block.description || "Ingen beskrivning tillgänglig"}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-6">
            {/* Block Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Block Inställningar
                </Label>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Antal varv:</span>
                    {isEditing ? (
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={editRounds}
                        onChange={(e) => setEditRounds(parseInt(e.target.value) || 1)}
                        className="w-20 h-6 text-xs"
                      />
                    ) : (
                      <span className="font-medium">{block.rounds}</span>
                    )}
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Varianter:</span>
                    <span className="font-medium">{variants.data?.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total pass:</span>
                    <span className="font-medium">{schedule.data?.length || 0}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Tidsstämplar
                </Label>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Skapad:</span>
                    <span className="font-mono text-xs">
                      {format(new Date(block.created_at), "d MMM yyyy", { locale: sv })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Uppdaterad:</span>
                    <span className="font-mono text-xs">
                      {format(new Date(block.updated_at), "d MMM yyyy", { locale: sv })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Variants Overview */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Varianter</Label>
              {variants.data && variants.data.length > 0 ? (
                <div className="space-y-2">
                  {variants.data.map((variant) => (
                    <div key={variant.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{variant.variant_label}</Badge>
                        <span className="font-medium">
                          {variant.name || `Variant ${variant.variant_label}`}
                        </span>
                      </div>
                      {variant.notes && (
                        <span className="text-sm text-muted-foreground truncate max-w-48">
                          {variant.notes}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Inga varianter skapade än</p>
              )}
            </div>

            <Separator />

            {/* Session Schedule Preview */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Pass Schema</Label>
              {schedule.data && schedule.data.length > 0 ? (
                <div className="grid grid-cols-8 gap-2">
                  {schedule.data.slice(0, 16).map((session) => (
                    <div key={session.id} className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">
                        Pass {session.session_number}
                      </div>
                      <Badge variant="secondary" className="w-full justify-center">
                        {session.variant_label}
                      </Badge>
                    </div>
                  ))}
                  {schedule.data.length > 16 && (
                    <div className="text-center">
                      <div className="text-xs text-muted-foreground mb-1">...</div>
                      <Badge variant="outline" className="w-full justify-center">
                        +{schedule.data.length - 16}
                      </Badge>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Inget schema definierat</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort block</AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ta bort "{block.name}"? Denna åtgärd kan inte ångras.
              Alla varianter, övningar och scheman kommer att tas bort permanent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Ta bort
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}