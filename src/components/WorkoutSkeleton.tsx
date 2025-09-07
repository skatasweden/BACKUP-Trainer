import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Target, Clock } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

interface ExerciseDetails {
  id: string;
  title: string;
  short_description: string | null;
  long_description: string | null;
  cover_image_url: string | null;
  youtube_url: string | null;
}

interface ProtocolDetails {
  id: string;
  name: string;
  description: string | null;
  sets: number | null;
  repetitions: number | null;
  intensity_value: number | null;
  intensity_type: string | null;
}

interface BlockVariant {
  id: string;
  variant_label: string;
  items: BlockItemDetails[];
}

interface BlockDetails {
  id: string;
  name: string;
  description: string | null;
  rounds: number | null;
  variants?: BlockVariant[];
}

interface BlockItemDetails {
  exercise: ExerciseDetails;
  protocol: ProtocolDetails;
  sort_order: number;
}

interface PlanItemWithDetails {
  id: string;
  item_type: 'exercise' | 'block' | 'rest' | 'info';
  item_id: string | null;
  content: string | null;
  sort_order: number;
  exercise?: ExerciseDetails;
  protocol?: ProtocolDetails;
  block?: BlockDetails;
}

interface WorkoutSkeletonProps {
  items: PlanItemWithDetails[];
  onItemClick: (itemId: string) => void;
  programId?: string; // Add programId support
}

// Hook for processing workout data with memoization
function useProcessedWorkoutItems(items: PlanItemWithDetails[]) {
  return useMemo(() => {
    if (!items || items.length === 0) return [];
    
    return items.reduce((acc, item, index) => {
      const baseGroup = { index: index + 1 };
      
      try {
        switch (item.item_type) {
          case 'block':
            // Handle both detailed block data and fallback data
            const blockName = item.block?.name || 'Laddar block...';
            const rounds = item.block?.rounds || 1;
            
            acc.push({
              ...baseGroup,
              type: 'block',
              blockName,
              rounds,
              items: [item],
            });
            break;
          case 'exercise':
            // Handle both detailed exercise data and fallback data
            if (item.exercise || item.item_type === 'exercise') {
              acc.push({
                ...baseGroup,
                type: 'exercise',
                items: [item],
              });
            }
            break;
          case 'rest':
          case 'info':
            acc.push({
              ...baseGroup,
              type: item.item_type,
              items: [item],
            });
            break;
        }
      } catch (error) {
        console.warn('Error processing workout item:', error, item);
      }
      
      return acc;
    }, [] as Array<{
      type: string;
      blockName?: string;
      rounds?: number;
      items: PlanItemWithDetails[];
      index: number;
    }>);
  }, [items]);
}

// Individual components for better maintainability
interface BlockExerciseItemProps {
  blockItem: BlockItemDetails;
  itemId: string;
  onItemClick: (itemId: string) => void;
  programId?: string; // Add programId support
}

function BlockExerciseItem({ blockItem, itemId, onItemClick, programId }: BlockExerciseItemProps) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    // For block exercises, navigate with exercise and protocol IDs as query params
    const programIdParam = programId ? `&programId=${programId}` : '';
    navigate(`/athlete/exercises/${itemId}?exerciseId=${blockItem.exercise?.id}&protocolId=${blockItem.protocol?.id}${programIdParam}`);
  };
  
  return (
    <div 
      className="w-full p-3 text-left rounded-md border border-transparent hover:border-border hover:bg-accent/50 cursor-pointer transition-all group"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-1">
          <div className="font-medium text-sm group-hover:text-primary transition-colors">
            {blockItem.exercise?.title || 'Okänd övning'}
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="font-medium text-primary">
              {blockItem.protocol?.name || 'Inget protokoll'}
            </span>
            {blockItem.protocol?.sets && blockItem.protocol?.repetitions && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {blockItem.protocol.sets} × {blockItem.protocol.repetitions}
              </span>
            )}
            {blockItem.protocol?.intensity_value && (
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                {blockItem.protocol.intensity_value}{blockItem.protocol.intensity_type || '%'}
              </span>
            )}
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </div>
  );
}

interface ExerciseItemProps {
  item: PlanItemWithDetails;
  onItemClick: (itemId: string) => void;
  programId?: string; // Add programId support
}

function ExerciseItem({ item, onItemClick, programId }: ExerciseItemProps) {
  const navigate = useNavigate();
  
  const handleClick = () => {
    // For direct exercises, navigate to exercise detail with programId
    const programIdParam = programId ? `?programId=${programId}` : '';
    navigate(`/athlete/exercises/${item.id}${programIdParam}`);
  };
  
  return (
    <div 
      className="flex-1 p-0 text-left rounded-md border border-transparent hover:border-border cursor-pointer transition-all group"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
    >
      <div className="flex items-center justify-between p-3">
        <div className="flex-1 space-y-1">
          <div className="font-medium text-sm group-hover:text-primary transition-colors">
            {item.exercise?.title || 'Okänd övning'}
          </div>
          {item.exercise?.short_description && (
            <div className="text-xs text-muted-foreground line-clamp-1">
              {item.exercise.short_description}
            </div>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors ml-2" />
      </div>
    </div>
  );
}

interface RestInfoItemProps {
  type: 'rest' | 'info';
  content?: string | null;
}

function RestInfoItem({ type, content }: RestInfoItemProps) {
  const isRest = type === 'rest';
  
  return (
    <div className="flex items-center gap-2 text-sm">
      <div className={`w-2 h-2 rounded-full ${isRest ? 'bg-orange-500' : 'bg-blue-500'}`} />
      <span className="font-medium">{isRest ? 'Vila' : 'Info'}</span>
      {content && (
        <span className="text-muted-foreground">- {content}</span>
      )}
    </div>
  );
}

export function WorkoutSkeleton({ items, onItemClick, programId }: WorkoutSkeletonProps) {
  const navigate = useNavigate();
  const groupedItems = useProcessedWorkoutItems(items);
  
  // Debug logging
  console.log("🔍 WorkoutSkeleton items:", items);
  console.log("🔍 WorkoutSkeleton groupedItems:", groupedItems);
  
  const handleExerciseClick = (itemId: string) => {
    const programIdParam = programId ? `?programId=${programId}` : '';
    navigate(`/athlete/exercises/${itemId}${programIdParam}`);
  };
  
  if (groupedItems.length === 0) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Träningsöversikt</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground py-8">
            Ingen träning att visa
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Träningsöversikt</CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {groupedItems.map((group) => (
            <div key={`${group.type}-${group.index}`} className="space-y-2">
              {group.type === 'block' ? (
                <div className="border rounded-lg p-4 bg-muted/30">
                  {/* Block header */}
                  <div className="flex items-center gap-3 mb-3">
                    <Badge variant="secondary" className="text-sm font-medium">
                      {group.index}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-base">{group.blockName}</h3>
                      <Badge variant="outline" className="text-xs">
                        <Target className="w-3 h-3 mr-1" />
                        {group.rounds} varv
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Block exercises */}
                  <div className="space-y-2 ml-4 border-l-2 border-border pl-4">
                    {group.items.map((item) => {
                      console.log("🔍 WorkoutSkeleton block item:", item);
                      
                      // Get exercises from block variants (use first variant for now)
                      const blockExercises = item.block?.variants?.[0]?.items || [];
                      
                      return (
                        <div key={item.id} className="space-y-2">
                          {blockExercises.length > 0 ? (
                            blockExercises.map((blockItem, idx) => (
                               <BlockExerciseItem
                                 key={`${item.id}-${blockItem.exercise?.id || idx}`}
                                 blockItem={blockItem}
                                 itemId={item.id}
                                 onItemClick={handleExerciseClick}
                                 programId={programId}
                               />
                            ))
                          ) : (
                            <div 
                              className="w-full p-4 rounded-md border bg-card space-y-2 cursor-pointer hover:bg-accent/50 transition-colors"
                              onClick={() => handleExerciseClick(item.id)}
                            >
                              <div className="font-medium text-base">
                                {item.block?.name || 'Okänt block'}
                              </div>
                              {item.block?.rounds && (
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Target className="w-3 h-3" />
                                  {item.block.rounds} varv
                                </div>
                              )}
                              {item.block?.description && (
                                <p className="text-sm text-muted-foreground">
                                  {item.block.description}
                                </p>
                              )}
                              <div className="text-xs text-muted-foreground">
                                Klicka för att se block-detaljer
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/30 transition-colors">
                  <Badge variant="secondary" className="text-sm font-medium">
                    {group.index}
                  </Badge>
                  
                  {group.type === 'exercise' && group.items[0]?.exercise ? (
                     <ExerciseItem 
                       item={group.items[0]} 
                       onItemClick={handleExerciseClick}
                       programId={programId}
                     />
                  ) : (group.type === 'rest' || group.type === 'info') ? (
                    <RestInfoItem 
                      type={group.type as 'rest' | 'info'} 
                      content={group.items[0]?.content} 
                    />
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}