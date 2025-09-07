import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Search, Archive, Copy, Eye, Settings, Target, Trash2 } from "lucide-react";
import { useBlocks, useBlockVariants, useSessionSchedule, useDeleteBlock } from "@/hooks/useBlocks";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { BlockDetailsDialog } from "@/components/blocks/BlockDetailsDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { sv } from "date-fns/locale";

interface BlockCardProps {
  block: {
    id: string;
    name: string;
    description?: string;
    rounds: number;
    is_archived: boolean;
    created_at: string;
    updated_at: string;
    variant_count?: number;
  };
  onEdit: () => void;
  onViewDetails: () => void;
  onDelete: () => void;
}

function BlockCard({ block, onEdit, onViewDetails, onDelete }: BlockCardProps) {
  const { variants } = useBlockVariants(block.id);
  const { schedule } = useSessionSchedule(block.id);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg">{block.name}</CardTitle>
          <div className="flex gap-1">
            {block.is_archived && (
              <Badge variant="secondary" className="text-xs">
                <Archive className="h-3 w-3 mr-1" />
                Arkiverad
              </Badge>
            )}
          </div>
        </div>
        {block.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {block.description}
          </p>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Block Stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-lg font-bold text-primary">{block.rounds}</div>
            <div className="text-xs text-muted-foreground">Varv</div>
          </div>
          <div>
            <div className="text-lg font-bold text-primary">{variants.data?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Varianter</div>
          </div>
          <div>
            <div className="text-lg font-bold text-primary">{schedule.data?.length || 0}</div>
            <div className="text-xs text-muted-foreground">Pass</div>
          </div>
        </div>

        {/* Variants Preview */}
        {variants.data && variants.data.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Varianter:</div>
            <div className="flex flex-wrap gap-1">
              {variants.data.slice(0, 4).map((variant) => (
                <Badge key={variant.id} variant="outline" className="text-xs">
                  {variant.variant_label}
                </Badge>
              ))}
              {variants.data.length > 4 && (
                <Badge variant="secondary" className="text-xs">
                  +{variants.data.length - 4}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Schedule Preview */}
        {schedule.data && schedule.data.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-medium text-muted-foreground">Schema:</div>
            <div className="flex flex-wrap gap-1">
              {schedule.data.slice(0, 8).map((session) => (
                <span key={session.id} className="text-xs font-mono bg-muted px-1 rounded">
                  {session.variant_label}
                </span>
              ))}
              {schedule.data.length > 8 && (
                <span className="text-xs text-muted-foreground">
                  +{schedule.data.length - 8}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onViewDetails} className="flex-1">
            <Eye className="h-4 w-4 mr-1" />
            Detaljer
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit} className="flex-1">
            <Settings className="h-4 w-4 mr-1" />
            Redigera
          </Button>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                // Handle duplicate
              }}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Ta bort block permanent</AlertDialogTitle>
                  <AlertDialogDescription>
                    Är du säker på att du vill ta bort "{block.name}" permanent? 
                    Denna åtgärd kan inte ångras. Alla varianter, övningar och scheman kommer att tas bort.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Avbryt</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={onDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Ta bort permanent
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Metadata */}
        <div className="text-xs text-muted-foreground border-t pt-2">
          Uppdaterad: {format(new Date(block.updated_at), "d MMM", { locale: sv })}
        </div>
      </CardContent>
    </Card>
  );
}

export default function CoachBlocks() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const { blocks, createBlock } = useBlocks();
  const deleteBlock = useDeleteBlock();
  const navigate = useNavigate();

  const handleCreateBlock = async () => {
    try {
      const newBlock = await createBlock.mutateAsync({
        name: "Nytt Block",
        description: "",
        rounds: 1,
      });
      navigate(`/coach/blocks/${newBlock.id}`);
    } catch (error) {
      console.error("Failed to create block:", error);
    }
  };

  const handleViewDetails = (blockId: string) => {
    setSelectedBlockId(blockId);
    setShowDetailsDialog(true);
  };

  const handleDelete = async (blockId: string) => {
    try {
      await deleteBlock.mutateAsync(blockId);
    } catch (error) {
      console.error("Failed to delete block:", error);
    }
  };

  const filteredBlocks = blocks.data?.filter(block =>
    block.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    block.description?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Block</h1>
          <p className="text-muted-foreground">
            Skapa återanvändbara byggstenar som kombinerar övningar med protokoll
          </p>
        </div>
        <Button onClick={handleCreateBlock} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nytt Block
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Sök block..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Blocks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBlocks.map((block) => (
          <BlockCard 
            key={block.id} 
            block={block} 
            onEdit={() => navigate(`/coach/blocks/${block.id}`)}
            onViewDetails={() => handleViewDetails(block.id)}
            onDelete={() => handleDelete(block.id)}
          />
        ))}
      </div>

      {filteredBlocks.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            Inga block hittades
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchQuery ? "Prova att ändra dina söktermer" : "Skapa ditt första block för att komma igång"}
          </p>
          {!searchQuery && (
            <Button onClick={handleCreateBlock}>
              <Plus className="h-4 w-4 mr-2" />
              Skapa ditt första block
            </Button>
          )}
        </div>
      )}

      {/* Details Dialog */}
      <BlockDetailsDialog
        blockId={selectedBlockId}
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
      />
    </div>
  );
}