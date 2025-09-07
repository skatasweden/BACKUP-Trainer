import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Target, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAthleteExerciseDetail } from "@/hooks/useAthleteExerciseDetail";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

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

interface PlanItemDetails {
  id: string;
  item_type: 'exercise' | 'block' | 'rest' | 'info';
  exercise?: ExerciseDetails;
  protocol?: ProtocolDetails;
  content: string | null;
}

export default function AthleteExerciseDetail() {
  const { itemId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const exerciseId = searchParams.get('exerciseId');
  const protocolId = searchParams.get('protocolId');
  const programId = searchParams.get('programId'); // Add programId support
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  // Wait for auth to be established before making requests
  const shouldFetch = !authLoading && !!user && !!itemId;
  
  // Use optimized hook for single query with programId
  const { data: planItem, isLoading, error } = useAthleteExerciseDetail(
    shouldFetch ? itemId : undefined, 
    exerciseId, 
    protocolId, 
    programId
  );

  // Debug logging
  if (planItem) {
    console.log('=== AthleteExerciseDetail Debug ===');
    console.log('planItem:', planItem);
    console.log('protocol exists:', !!planItem.protocol);
    console.log('protocol data:', planItem.protocol);
  }

  if (authLoading || isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="h-64 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }
  if (error?.message === 'NO_SESSION') {
    return (
      <div className="container mx-auto p-6">
        <Button 
          variant="outline" 
          onClick={() => navigate('/auth')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Logga In
        </Button>
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="text-muted-foreground">
                Du måste logga in för att se denna övning
              </div>
              <Button onClick={() => navigate('/auth')}>
                Logga In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error?.message === 'UNAUTHORIZED_ACCESS') {
    return (
      <div className="container mx-auto p-6">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka
        </Button>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              Du har inte tillgång till denna övning
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-48"></div>
          <div className="h-64 bg-muted rounded"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!planItem) {
    return (
      <div className="container mx-auto p-6">
        <Button 
          variant="outline" 
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tillbaka
        </Button>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">
              Övning kunde inte hittas eller du har inte tillgång till den
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getYouTubeEmbedUrl = (url: string) => {
    // Handle different YouTube URL formats
    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('v=')[1]?.split('&')[0] || '';
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('embed/')[1]?.split('?')[0] || '';
    }
    return `https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&showinfo=0&controls=1&fs=1&cc_load_policy=0`;
  };

  // Helper function to determine which video to show - ALWAYS show exercise video
  const getVideoUrl = () => {
    // Always prioritize exercise's youtube_url if available
    if (planItem?.exercise?.youtube_url) {
      return planItem.exercise.youtube_url;
    }
    
    // Fall back to program_item video settings only if no exercise video exists
    if (planItem.program_item?.show_video === true && planItem.program_item?.video_url) {
      return planItem.program_item.video_url;
    }
    
    return null;
  };

  const handleNextExercise = () => {
    if (planItem?.navigation?.next_exercise) {
      const { exercise_id, protocol_id } = planItem.navigation.next_exercise;
      const programIdParam = programId ? `&programId=${programId}` : '';
      navigate(`/athlete/exercises/${itemId}?exerciseId=${exercise_id}&protocolId=${protocol_id}${programIdParam}`);
    }
  };

  const handleCompleteBlock = () => {
    if (planItem?.navigation?.next_block?.first_exercise) {
      // Navigate to first exercise in next block
      const { exercise_id, protocol_id } = planItem.navigation.next_block.first_exercise;
      const nextBlockItemId = planItem.navigation.next_block.id;
      const programIdParam = programId ? `&programId=${programId}` : '';
      navigate(`/athlete/exercises/${nextBlockItemId}?exerciseId=${exercise_id}&protocolId=${protocol_id}${programIdParam}`);
    } else {
      // No next block - complete workout
      const programIdParam = programId ? `&programId=${programId}` : '';
      navigate(`/athlete/workouts/${planItem?.plan_item?.workout_id}?completed=true${programIdParam}`);
    }
  };

  const hasNextExercise = planItem?.navigation?.has_next_exercise || false;
  const isLastExerciseInBlock = planItem?.navigation?.is_last_exercise || false;

  const getProgressionButtonText = () => {
    if (hasNextExercise) {
      return "Nästa övning";
    }
    
    if (isLastExerciseInBlock) {
      const currentBlockName = planItem?.current_block?.name || "blocket";
      
      // Check if there's a next block
      if (planItem?.navigation?.next_block) {
        return `Klar med ${currentBlockName.toLowerCase()} – fortsätt till ${planItem.navigation.next_block.block_name || 'nästa block'}`;
      } else {
        return `Registrera pass som klart`;
      }
    }
    
    return "Fortsätt";
  };

  const getProgressionAction = () => {
    if (hasNextExercise) {
      return handleNextExercise;
    } else {
      return handleCompleteBlock;
    }
  };

  const shouldShowProgressionButton = hasNextExercise || isLastExerciseInBlock;



  // Helper to get combined description and handle text truncation
  const getDescriptionContent = () => {
    const shortDesc = planItem?.exercise?.short_description || '';
    const longDesc = planItem?.exercise?.long_description || '';
    const fullText = [shortDesc, longDesc].filter(Boolean).join(' ');
    
    if (!fullText) return { displayText: '', hasMore: false };
    
    // Split by sentence-ending punctuation followed by space and capital letter
    const sentences = fullText.split(/(?<=[.!?])\s+(?=[A-ZÅÄÖ])/);
    
    if (sentences.length <= 2) {
      return { displayText: fullText, hasMore: false };
    }
    
    const truncatedText = sentences.slice(0, 2).join(' ');
    return { 
      displayText: isDescriptionExpanded ? fullText : truncatedText,
      hasMore: true
    };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Video Section */}
      {getVideoUrl() && (
        <div className="relative w-full aspect-video bg-black">
          <iframe
            src={getYouTubeEmbedUrl(getVideoUrl()!)}
            title={planItem.exercise?.title || 'Exercise Video'}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
          
          {/* Back button overlay */}
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 bg-black/50 text-white hover:bg-black/70 backdrop-blur-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka
          </Button>
        </div>
      )}

      {/* Content */}
      <div className="px-4 py-6 space-y-6">
        {/* Header with exercise name and protocol in one line */}
         <div className="space-y-3">
           <div className="flex items-start justify-between gap-4">
             <div className="flex-1">
               <h1 className="text-xl font-bold leading-tight">
                 {planItem.exercise?.title || 'Okänd övning'}
               </h1>
               
               {/* Exercise Description */}
               {(planItem.exercise?.short_description || planItem.exercise?.long_description) && (() => {
                 const { displayText, hasMore } = getDescriptionContent();
                 return (
                   <div className="mt-3">
                     <div className="text-sm leading-relaxed">
                       {displayText}
                       {hasMore && (
                         <span className="ml-1">
                           {!isDescriptionExpanded && '... '}
                           <span 
                             onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                             className="text-primary hover:text-primary/80 cursor-pointer transition-colors"
                           >
                             {isDescriptionExpanded ? 'Visa mindre' : 'Läs mer'}
                           </span>
                         </span>
                       )}
                     </div>
                   </div>
                 );
               })()}
             </div>
           </div>
         </div>

        {/* Back button for when there's no video */}
        {!getVideoUrl() && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka
          </Button>
        )}

        {/* Protocol Statistics Grid */}
        {planItem?.protocol && (
          <div className="grid grid-cols-3 gap-3">
            {planItem.protocol.sets && (
              <div className="text-center py-3 bg-muted/30 rounded-lg">
                <div className="text-lg font-bold">{planItem.protocol.sets}</div>
                <div className="text-xs text-muted-foreground">Set</div>
              </div>
            )}
            {planItem.protocol.repetitions && (
              <div className="text-center py-3 bg-muted/30 rounded-lg">
                <div className="text-lg font-bold">{planItem.protocol.repetitions}</div>
                <div className="text-xs text-muted-foreground">Reps</div>
              </div>
            )}
            {planItem.protocol.intensity_value && (
              <div className="text-center py-3 bg-muted/30 rounded-lg">
                <div className="text-lg font-bold">
                  {planItem.protocol.intensity_value}{planItem.protocol.intensity_type === 'percentage' ? '%' : (planItem.protocol.intensity_type || '%')}
                </div>
                <div className="text-xs text-muted-foreground">Intensitet</div>
              </div>
            )}
          </div>
        )}



        {/* Additional Content */}
        {planItem.plan_item?.content && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Information
            </h2>
            <p className="text-sm leading-relaxed">{planItem.plan_item.content}</p>
          </div>
        )}

        {/* Progression Button */}
        {shouldShowProgressionButton && (
          <div className="flex justify-center pt-6 pb-4">
            {hasNextExercise ? (
              /* Circular check button for next exercise */
              <Button 
                onClick={getProgressionAction()}
                size="lg"
                className="w-16 h-16 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                aria-label="Markera som klar och gå till nästa övning"
              >
                <Check className="w-6 h-6" />
              </Button>
            ) : (
              /* Full-width text button for block completion */
              <div className="w-full max-w-sm space-y-2">
                <Button 
                  onClick={getProgressionAction()}
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg rounded-xl py-4 px-6"
                  aria-live="polite"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">{getProgressionButtonText()}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </Button>
                {planItem?.current_block?.name && (
                  <p className="text-center text-sm text-muted-foreground">
                    {planItem.navigation?.next_block 
                      ? `Nästa: ${planItem.navigation.next_block.block_name}`
                      : "Sista blocket i passet"
                    }
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}