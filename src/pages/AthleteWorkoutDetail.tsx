import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useAthleteWorkoutDetail } from "@/hooks/useAthleteWorkoutDetail";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Play, Clock, Target, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { WorkoutSkeleton } from "@/components/WorkoutSkeleton";

function extractYouTubeVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

interface WorkoutDetails {
  id: string;
  title: string;
  short_description: string | null;
  long_description: string | null;
  cover_image_url: string | null;
  video_url: string | null;
}

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

interface BlockVariant {
  id: string;
  variant_label: string;
  items: BlockItemDetails[];
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

export default function AthleteWorkoutDetail() {
  const { workoutId } = useParams<{ workoutId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const programId = searchParams.get('programId') || searchParams.get('program_id'); // Support both formats for compatibility
  const sortOrder = searchParams.get('sort_order');
  
  console.log('🔍 AthleteWorkoutDetail URL params:', { 
    workoutId, 
    programId, 
    sortOrder,
    fullURL: window.location.href 
  });
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [isDesktop, setIsDesktop] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  const exerciseId = searchParams.get('exercise');
  const isSheetOpen = !!exerciseId;

  // Detect desktop screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Use optimized hook for single query
  const { data: workoutData, isLoading, error: workoutError } = useAthleteWorkoutDetail(workoutId, programId, sortOrder);

  // Extract data from optimized response
  const workout = workoutData?.workout;
  const itemsWithDetails = workoutData?.plan_items;
  const programItem = workoutData?.program_item;

  // Debug logging
  console.log("🔍 AthleteWorkoutDetail workoutData:", workoutData);
  console.log("🔍 AthleteWorkoutDetail itemsWithDetails:", itemsWithDetails);
  console.log("🔍 AthleteWorkoutDetail program_item:", workoutData?.program_item);
  console.log("🔍 AthleteWorkoutDetail programId:", programId);
  console.log("🔍 AthleteWorkoutDetail debug_info:", workoutData?.debug_info);
  console.log("🔍 AthleteWorkoutDetail full data keys:", workoutData ? Object.keys(workoutData) : 'no data');

  const handleBack = () => {
    navigate('/athlete/upcoming-workouts');
  };

  const handleExerciseClick = (itemId: string) => {
    setSearchParams({ exercise: itemId });
  };

  const handleCloseSheet = () => {
    setSearchParams({});
  };

  const handleToggleComplete = (itemId: string) => {
    setCompletedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  // Find selected exercise details
  const selectedItem = exerciseId ? itemsWithDetails?.find(item => item.id === exerciseId) : null;

  // Get unique exercises for the exercises tab
  const uniqueExercises = itemsWithDetails?.filter(item => item.item_type === 'exercise' && item.exercise) || [];
  const exerciseItems = itemsWithDetails?.filter(item => item.item_type === 'exercise' || item.item_type === 'block') || [];

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-64 w-full" />
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl p-4 md:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBack} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold truncate">{workout.title}</h1>
            {workout.short_description && (
              <p className="text-muted-foreground mt-1">{workout.short_description}</p>
            )}
          </div>
          <Button size="lg" className="gap-2 shrink-0">
            <Play className="w-4 h-4" />
            Starta träning
          </Button>
        </div>

        {/* Program Item Video - Show above description if enabled */}
        {programItem?.show_video && programItem?.video_url && (
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-6">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <iframe
                  src={`https://www.youtube.com/embed/${extractYouTubeVideoId(programItem.video_url)}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Description */}
        {workout.long_description && (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Beskrivning</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="whitespace-pre-wrap leading-relaxed">
                  {isDescriptionExpanded 
                    ? workout.long_description
                    : workout.long_description.length > 200 
                      ? `${workout.long_description.substring(0, 200)}...`
                      : workout.long_description
                  }
                </p>
                {workout.long_description.length > 200 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                    className="h-auto p-0 font-medium text-primary hover:text-primary/80"
                  >
                    {isDescriptionExpanded ? "Läs mindre" : "Läs mer"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}


        {/* Workout Content */}
        {itemsWithDetails && itemsWithDetails.length > 0 && (
          <WorkoutSkeleton 
            items={itemsWithDetails} 
            onItemClick={handleExerciseClick}
            programId={programId || undefined}
          />
        )}


        {/* Exercise Detail Sheet */}
        <Sheet open={isSheetOpen} onOpenChange={handleCloseSheet}>
          <SheetContent 
            side={isDesktop ? "right" : "bottom"} 
            className={isDesktop ? "w-[600px] max-w-[90vw]" : "h-[90vh]"}
          >
            {selectedItem && (
              <>
                 <SheetHeader className="pb-4">
                   <SheetTitle className="text-left text-xl">
                     {selectedItem.item_type === 'exercise' && selectedItem.exercise?.title}
                     {selectedItem.item_type === 'block' && selectedItem.block?.name}
                   </SheetTitle>
                 </SheetHeader>
                
                <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-120px)]">
                  {/* Exercise Image/Video */}
                  {selectedItem.exercise?.cover_image_url && (
                    <div className="max-w-md mx-auto">
                      <AspectRatio ratio={16 / 9} className="rounded-lg overflow-hidden">
                        <img
                          src={selectedItem.exercise.cover_image_url}
                          alt={selectedItem.exercise.title}
                          className="w-full h-full object-cover"
                        />
                      </AspectRatio>
                    </div>
                  )}

                   {/* Block Items Info */}
                   {selectedItem.item_type === 'block' && selectedItem.block?.variants && (
                     <div className="space-y-4">
                       {selectedItem.block.variants.map(variant => (
                         <div key={variant.id} className="space-y-2">
                           <h4 className="font-medium text-sm">{variant.variant_label}</h4>
                           <div className="space-y-1">
                             {variant.items.map((item, idx) => (
                               <div key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                                 <span className="text-sm font-medium">{item.exercise.title}</span>
                                 <div className="flex gap-2 text-xs text-muted-foreground">
                                   {item.protocol.sets && <span>{item.protocol.sets}x</span>}
                                   {item.protocol.repetitions && <span>{item.protocol.repetitions}</span>}
                                   {item.protocol.intensity_value && <span>{item.protocol.intensity_value}%</span>}
                                 </div>
                               </div>
                             ))}
                           </div>
                         </div>
                       ))}
                     </div>
                   )}

                   {/* Description */}
                   {(selectedItem.exercise?.long_description || selectedItem.block?.description) && (
                     <Card>
                       <CardHeader>
                         <CardTitle>Beskrivning</CardTitle>
                       </CardHeader>
                       <CardContent>
                         <p className="whitespace-pre-wrap leading-relaxed">
                           {selectedItem.exercise?.long_description || selectedItem.block?.description}
                         </p>
                       </CardContent>
                     </Card>
                   )}

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4 sticky bottom-0 bg-background pb-4">
                    <Button 
                      className="flex-1" 
                      size="lg"
                      variant={completedItems.has(selectedItem.id) ? "secondary" : "default"}
                      onClick={() => handleToggleComplete(selectedItem.id)}
                    >
                      {completedItems.has(selectedItem.id) ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Slutförd
                        </>
                      ) : (
                        "Markera som klar"
                      )}
                    </Button>
                  </div>
                </div>
              </>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}