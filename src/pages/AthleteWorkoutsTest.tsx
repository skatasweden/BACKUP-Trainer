import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Play, Calendar, Clock, Eye, Dumbbell, Timer, Info, Pause, Target, Repeat, Zap } from "lucide-react";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { useWorkoutPlanItems } from "@/hooks/useWorkouts";

interface ProgramWithWorkouts {
  id: string;
  name: string;
  short_description: string | null;
  cover_image_url: string | null;
  video_url: string | null;
  created_at: string;
  program_items: Array<{
    id: string;
    sort_order: number;
    workouts: {
      id: string;
      title: string;
      short_description: string | null;
      cover_image_url: string | null;
      video_url: string | null;
      created_at: string;
    } | null;
  }>;
}

function useAllProgramsWithWorkouts() {
  return useQuery({
    queryKey: ["programs-with-workouts"],
    queryFn: async () => {
      // First fetch all programs
      const { data: programs, error: programsError } = await supabase
        .from("programs")
        .select("*")
        .eq("is_archived", false)
        .order("created_at", { ascending: false });
      
      if (programsError) throw programsError;

      // Then fetch all program items with workouts for all programs
      const { data: programItems, error: itemsError } = await supabase
        .from("program_items")
        .select(`
          id,
          program_id,
          sort_order,
          workouts (
            id,
            title,
            short_description,
            cover_image_url,
            video_url,
            created_at
          )
        `)
        .order("sort_order");
      
      if (itemsError) throw itemsError;

      // Combine programs with their items
      const programsWithWorkouts = programs?.map(program => ({
        ...program,
        program_items: programItems?.filter(item => item.program_id === program.id) || []
      })) || [];

      return programsWithWorkouts;
    },
  });
}

function useWorkoutItemDetails(workoutId: string) {
  return useQuery({
    queryKey: ["workout-item-details", workoutId],
    queryFn: async () => {
      const { data: planItems, error: planError } = await supabase
        .from("workout_plan_items")
        .select("*")
        .eq("workout_id", workoutId)
        .order("sort_order", { ascending: true });

      if (planError) throw planError;

      // Get unique exercise IDs and block IDs
      const exerciseIds = planItems?.filter(item => item.item_type === 'exercise' && item.item_id)
        .map(item => item.item_id).filter(Boolean) || [];
      
      const blockIds = planItems?.filter(item => item.item_type === 'block' && item.item_id)
        .map(item => item.item_id).filter(Boolean) || [];

      // Fetch exercises
      const exercises = exerciseIds.length > 0 ? await supabase
        .from("exercises")
        .select("*")
        .in("id", exerciseIds) : { data: [] };

      // Fetch blocks with their items and protocols
      const blocks = blockIds.length > 0 ? await supabase
        .from("blocks")
        .select(`
          *,
          block_variants (
            *,
            block_items (
              *,
              exercises (*),
              protocols (*)
            )
          )
        `)
        .in("id", blockIds) : { data: [] };

      return {
        planItems: planItems || [],
        exercises: exercises.data || [],
        blocks: blocks.data || []
      };
    },
    enabled: !!workoutId,
  });
}

function ExerciseDetails({ exercise }: { exercise: any }) {
  if (!exercise) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
      <div className="flex items-start gap-3">
        {exercise.cover_image_url && (
          <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
            <img 
              src={exercise.cover_image_url} 
              alt={exercise.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1">
          <h5 className="font-semibold text-blue-900 dark:text-blue-100">{exercise.title}</h5>
          {exercise.short_description && (
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              {exercise.short_description}
            </p>
          )}
          {exercise.youtube_url && (
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                <Play className="h-3 w-3 mr-1" />
                Instruktionsvideo
              </Badge>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProtocolDetails({ protocol }: { protocol: any }) {
  if (!protocol) return null;

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
      <div className="flex items-center gap-2 mb-2">
        <Target className="h-4 w-4 text-green-600 dark:text-green-400" />
        <span className="font-medium text-green-900 dark:text-green-100">{protocol.name}</span>
        <Badge variant="outline" className="text-xs text-green-700 dark:text-green-300">
          {protocol.protocol_type}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        {protocol.sets && (
          <div className="flex items-center gap-1">
            <Repeat className="h-3 w-3 text-green-600 dark:text-green-400" />
            <span className="text-green-800 dark:text-green-200">{protocol.sets} set</span>
          </div>
        )}
        {protocol.repetitions && (
          <div className="flex items-center gap-1">
            <Timer className="h-3 w-3 text-green-600 dark:text-green-400" />
            <span className="text-green-800 dark:text-green-200">{protocol.repetitions} reps</span>
          </div>
        )}
        {protocol.intensity_value && (
          <div className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-green-600 dark:text-green-400" />
            <span className="text-green-800 dark:text-green-200">
              {protocol.intensity_value}{protocol.intensity_type || '%'}
            </span>
          </div>
        )}
      </div>
      
      {protocol.description && (
        <p className="text-xs text-green-700 dark:text-green-300 mt-2 italic">
          {protocol.description}
        </p>
      )}
    </div>
  );
}

function BlockDetails({ block, exercises, protocols }: { block: any; exercises: any[]; protocols: any[] }) {
  if (!block) return null;

  const firstVariant = block.block_variants?.[0];
  const blockItems = firstVariant?.block_items || [];

  return (
    <div className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
      <div className="flex items-center gap-2 mb-3">
        <Dumbbell className="h-4 w-4 text-purple-600 dark:text-purple-400" />
        <h5 className="font-semibold text-purple-900 dark:text-purple-100">{block.name}</h5>
        <Badge variant="outline" className="text-xs text-purple-700 dark:text-purple-300">
          {block.rounds || 1} ronder
        </Badge>
      </div>
      
      {block.description && (
        <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
          {block.description}
        </p>
      )}

      {blockItems.length > 0 && (
        <div className="space-y-2">
          <h6 className="text-xs font-medium text-purple-800 dark:text-purple-200 uppercase tracking-wide">
            Övningar i blocket:
          </h6>
          {blockItems.map((item: any, index: number) => (
            <div key={item.id} className="flex items-start gap-2 text-sm">
              <span className="flex-shrink-0 w-5 h-5 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded-full flex items-center justify-center text-xs font-medium">
                {index + 1}
              </span>
              <div className="flex-1 space-y-1">
                {item.exercises && (
                  <ExerciseDetails exercise={item.exercises} />
                )}
                {item.protocols && (
                  <ProtocolDetails protocol={item.protocols} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function getYouTubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  
  // Handle different YouTube URL formats
  const regex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(regex);
  
  if (match && match[1]) {
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  
  return null;
}

function WorkoutDetailsDialog({ workout }: { workout: any }) {
  const { planItems } = useWorkoutPlanItems(workout.id);
  const { data: itemDetails, isLoading: itemsLoading } = useWorkoutItemDetails(workout.id);
  const isLoading = planItems.isLoading || itemsLoading;
  const items = planItems.data;

  const getItemIcon = (itemType: string) => {
    switch (itemType) {
      case 'exercise':
        return <Dumbbell className="h-4 w-4" />;
      case 'block':
        return <Dumbbell className="h-4 w-4" />;
      case 'rest':
        return <Pause className="h-4 w-4" />;
      case 'info':
        return <Info className="h-4 w-4" />;
      default:
        return <Timer className="h-4 w-4" />;
    }
  };

  const getItemTypeLabel = (itemType: string) => {
    switch (itemType) {
      case 'exercise':
        return 'Övning';
      case 'block':
        return 'Block';
      case 'rest':
        return 'Vila';
      case 'info':
        return 'Information';
      default:
        return itemType;
    }
  };

  return (
    <DialogContent className="max-w-2xl max-h-[80vh]">
      <DialogHeader>
        <DialogTitle>{workout.title}</DialogTitle>
        {workout.short_description && (
          <p className="text-sm text-muted-foreground">
            {workout.short_description}
          </p>
        )}
      </DialogHeader>
      
      <ScrollArea className="max-h-[60vh]">
        <div className="space-y-4">
          {workout.video_url && (
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Play className="h-4 w-4" />
                Instruktionsvideo
              </h4>
              <div className="bg-muted rounded-lg overflow-hidden">
                {getYouTubeEmbedUrl(workout.video_url) ? (
                  <div className="aspect-video">
                    <iframe
                      src={getYouTubeEmbedUrl(workout.video_url)}
                      title="Träningsvideo"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="w-full h-full"
                    ></iframe>
                  </div>
                ) : (
                  <div className="p-3">
                    <a 
                      href={workout.video_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline"
                    >
                      Öppna video (extern länk)
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {workout.long_description && (
            <div className="space-y-2">
              <h4 className="font-medium">Beskrivning</h4>
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm whitespace-pre-wrap">{workout.long_description}</p>
              </div>
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <h4 className="font-medium">Träningsinnehåll</h4>
            {isLoading ? (
              <div className="text-sm text-muted-foreground">Laddar innehåll...</div>
            ) : items && items.length > 0 ? (
              <div className="space-y-3">
                {items.map((item, index) => {
                  const exercise = itemDetails?.exercises.find(ex => ex.id === item.item_id);
                  const block = itemDetails?.blocks.find(bl => bl.id === item.item_id);
                  
                  return (
                    <div key={item.id} className="space-y-3">
                      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full text-sm font-bold">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getItemIcon(item.item_type)}
                            <Badge variant="outline" className="text-xs">
                              {getItemTypeLabel(item.item_type)}
                            </Badge>
                          </div>
                          {item.content && (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap mb-2">
                              {item.content}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {/* Show exercise details */}
                      {item.item_type === 'exercise' && exercise && (
                        <ExerciseDetails exercise={exercise} />
                      )}
                      
                      {/* Show block details */}
                      {item.item_type === 'block' && block && (
                        <BlockDetails 
                          block={block} 
                          exercises={itemDetails?.exercises || []}
                          protocols={[]}
                        />
                      )}
                      
                      {/* Show rest period */}
                      {item.item_type === 'rest' && (
                        <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
                          <div className="flex items-center gap-2">
                            <Pause className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            <span className="font-medium text-orange-900 dark:text-orange-100">Vila</span>
                          </div>
                          <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
                            Ta en paus enligt instruktioner
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
                Detta träningspass har inget innehåll definierat än.
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </DialogContent>
  );
}

function WorkoutCard({ 
  workout, 
  programName, 
  orderInProgram 
}: { 
  workout: any; 
  programName: string; 
  orderInProgram: number;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer">
          <CardHeader className="pb-3">
            {workout.cover_image_url && (
              <div className="w-full h-32 bg-muted rounded-md mb-3 overflow-hidden">
                <img 
                  src={workout.cover_image_url} 
                  alt={workout.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    {programName}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    #{orderInProgram}
                  </Badge>
                </div>
                <CardTitle className="text-base font-semibold line-clamp-2">
                  {workout.title}
                </CardTitle>
              </div>
              
              <div className="ml-2 flex flex-col gap-1">
                {workout.video_url && (
                  <Badge variant="secondary" className="text-xs">
                    <Play className="h-3 w-3 mr-1" />
                    Video
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  <Eye className="h-3 w-3 mr-1" />
                  Visa
                </Badge>
              </div>
            </div>
            
            {workout.short_description && (
              <p className="text-sm text-muted-foreground line-clamp-3 mt-2">
                {workout.short_description}
              </p>
            )}
          </CardHeader>
          
          <CardContent className="pt-0">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>
                  Skapad: {format(new Date(workout.created_at), "d MMM yyyy", { locale: sv })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </DialogTrigger>
      <WorkoutDetailsDialog workout={workout} />
    </Dialog>
  );
}

export default function AthleteWorkoutsTest() {
  const { data: programs, isLoading, error } = useAllProgramsWithWorkouts();

  // Flatten all workouts from all programs with their context
  const allWorkouts = programs?.flatMap(program => 
    program.program_items
      .filter(item => item.workouts) // Only items that have associated workouts
      .sort((a, b) => a.sort_order - b.sort_order) // Sort by order within program
      .map((item, index) => ({
        ...item.workouts!,
        programName: program.name,
        programId: program.id,
        orderInProgram: index + 1,
        sortOrder: item.sort_order,
      }))
  ) || [];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Alla Träningspass</h1>
            <p className="text-muted-foreground">Träningspass från alla program i ordning</p>
          </div>
          <div className="text-center py-8">Laddar träningspass...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Alla Träningspass</h1>
            <p className="text-muted-foreground">Träningspass från alla program i ordning</p>
          </div>
          <div className="text-center py-8 text-destructive">
            Kunde inte ladda träningspass. Försök igen senare.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Alla Träningspass</h1>
          <p className="text-muted-foreground">
            Träningspass från alla program i ordning ({allWorkouts.length} träningspass från {programs?.length || 0} program)
          </p>
        </div>

        {programs && programs.length > 0 && (
          <div className="space-y-8">
            {programs.map((program) => {
              const programWorkouts = program.program_items
                .filter(item => item.workouts)
                .sort((a, b) => a.sort_order - b.sort_order);

              if (programWorkouts.length === 0) return null;

              return (
                <div key={program.id} className="space-y-4">
                  <div className="border-l-4 border-primary pl-4">
                    <h2 className="text-xl font-semibold">{program.name}</h2>
                    {program.short_description && (
                      <p className="text-muted-foreground text-sm mt-1">
                        {program.short_description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {programWorkouts.length} träningspass
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 ml-4">
                    {programWorkouts.map((item, index) => (
                      <WorkoutCard
                        key={item.id}
                        workout={item.workouts!}
                        programName={program.name}
                        orderInProgram={index + 1}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {(!programs || programs.length === 0) && (
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              Inga träningsprogram hittades.
            </div>
          </div>
        )}

        {programs && programs.length > 0 && allWorkouts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground">
              Träningsprogrammen innehåller inga träningspass än.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}