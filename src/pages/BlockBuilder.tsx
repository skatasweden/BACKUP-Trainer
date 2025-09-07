import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Plus, Settings, Save } from "lucide-react";
import { useBlock, useUpdateBlock } from "@/hooks/useBlocks";
import { ExerciseLibrary } from "@/components/blocks/ExerciseLibrary";
import { ProtocolLibrary } from "@/components/blocks/ProtocolLibrary";
import { VariantCanvas } from "@/components/blocks/VariantCanvas";
import { SessionSchedule } from "@/components/blocks/SessionSchedule";
import { VariantTabs } from "@/components/blocks/VariantTabs";
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
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";

export default function BlockBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: block, isLoading } = useBlock(id!);
  const updateBlock = useUpdateBlock();

  const [blockName, setBlockName] = useState("");
  const [blockDescription, setBlockDescription] = useState("");
  const [blockRounds, setBlockRounds] = useState(1);
  const [activeVariant, setActiveVariant] = useState("A");
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (block) {
      setBlockName(block.name);
      setBlockDescription(block.description || "");
      setBlockRounds(block.rounds || 1);
    }
  }, [block]);

  const handleSave = async () => {
    if (!id) return;
    
    try {
      await updateBlock.mutateAsync({
        id,
        name: blockName,
        description: blockDescription,
        rounds: blockRounds,
      });
    } catch (error) {
      console.error("Failed to update block:", error);
    }
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    // This will be handled by VariantCanvas
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!block) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Block ej hittat</h2>
          <p className="text-muted-foreground mb-4">Det begärda blocket kunde inte hittas.</p>
          <Button onClick={() => navigate("/coach/blocks")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka till block
          </Button>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragOver={handleDragOver}
    >
      <div className="h-screen flex flex-col bg-background">
        {/* Header */}
        <header className="border-b border-border bg-background/95 backdrop-blur px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate("/coach/blocks")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Tillbaka
              </Button>
              <div>
                <h1 className="text-xl font-bold">{blockName}</h1>
                <p className="text-sm text-muted-foreground">{blockDescription || "Ingen beskrivning"}</p>
              </div>
            </div>
            <Button onClick={handleSave} disabled={updateBlock.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateBlock.isPending ? "Sparar..." : "Spara"}
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar - Libraries */}
          <div className="w-80 border-r border-border bg-muted/10 overflow-y-auto">
            <Tabs defaultValue="exercises" className="h-full">
              <TabsList className="grid w-full grid-cols-2 m-4">
                <TabsTrigger value="exercises">Övningar</TabsTrigger>
                <TabsTrigger value="protocols">Protokoll</TabsTrigger>
              </TabsList>
              <TabsContent value="exercises" className="m-0 h-full">
                <ExerciseLibrary />
              </TabsContent>
              <TabsContent value="protocols" className="m-0 h-full">
                <ProtocolLibrary />
              </TabsContent>
            </Tabs>
          </div>

          {/* Center - Canvas */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b border-border p-4">
              <VariantTabs 
                blockId={id!}
                activeVariant={activeVariant}
                onVariantChange={setActiveVariant}
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <VariantCanvas 
                blockId={id!}
                activeVariant={activeVariant}
              />
            </div>
          </div>

          {/* Right Sidebar - Properties */}
          <div className="w-80 border-l border-border bg-muted/10 overflow-y-auto">
            <div className="p-4 space-y-6">
              {/* Block Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Settings className="h-4 w-4" />
                    Block Inställningar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="block-name">Namn</Label>
                    <Input
                      id="block-name"
                      value={blockName}
                      onChange={(e) => setBlockName(e.target.value)}
                      placeholder="Block namn"
                    />
                  </div>
                  <div>
                    <Label htmlFor="block-description">Beskrivning</Label>
                    <Textarea
                      id="block-description"
                      value={blockDescription}
                      onChange={(e) => setBlockDescription(e.target.value)}
                      placeholder="Beskriv blocket..."
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="block-rounds">Antal Varv</Label>
                    <Input
                      id="block-rounds"
                      type="number"
                      min="1"
                      max="10"
                      value={blockRounds}
                      onChange={(e) => setBlockRounds(parseInt(e.target.value) || 1)}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Session Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pass Schema</CardTitle>
                </CardHeader>
                <CardContent>
                  <SessionSchedule blockId={id!} />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId && activeId.startsWith('exercise-') ? (
            <Card className="opacity-80 shadow-lg rotate-2 scale-105">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-primary/20 flex items-center justify-center">
                    <Plus className="h-4 w-4 text-primary" />
                  </div>
                  <span className="font-medium">Drar övning...</span>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
}