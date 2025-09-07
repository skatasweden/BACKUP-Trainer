import { useUpcomingWorkouts } from "@/hooks/useUpcomingWorkouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Calendar, Play, Search, Target, RefreshCw, Bug } from "lucide-react";
import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";

export default function AthleteUpcomingWorkouts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { upcomingWorkouts } = useUpcomingWorkouts();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [showDebug, setShowDebug] = useState(false);

  const handleManualRefresh = () => {
    console.log("🔄 [DEBUG] Manual refresh triggered");
    queryClient.invalidateQueries({ queryKey: ["upcoming-workouts"] });
  };

  // Get unique programs for filtering
  const programs = useMemo(() => {
    if (!upcomingWorkouts.data) return [];
    const uniquePrograms = new Map();
    upcomingWorkouts.data.forEach(workout => {
      if (!uniquePrograms.has(workout.program_id)) {
        uniquePrograms.set(workout.program_id, {
          id: workout.program_id,
          name: workout.program_name,
        });
      }
    });
    return Array.from(uniquePrograms.values());
  }, [upcomingWorkouts.data]);

  // Filter workouts based on search and program
  const filteredWorkouts = useMemo(() => {
    if (!upcomingWorkouts.data) return [];
    
    return upcomingWorkouts.data.filter(workout => {
      const matchesSearch = workout.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          workout.short_description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          workout.program_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesProgram = !selectedProgram || workout.program_id === selectedProgram;
      
      return matchesSearch && matchesProgram;
    });
  }, [upcomingWorkouts.data, searchTerm, selectedProgram]);

  // Group workouts by program
  const groupedWorkouts = useMemo(() => {
    const groups: Record<string, typeof filteredWorkouts> = {};
    filteredWorkouts.forEach(workout => {
      if (!groups[workout.program_id]) {
        groups[workout.program_id] = [];
      }
      groups[workout.program_id].push(workout);
    });
    return groups;
  }, [filteredWorkouts]);

  if (upcomingWorkouts.isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Kommande Träningspass</h1>
          <p className="text-muted-foreground">Alla dina tillgängliga träningspass</p>
        </div>
        
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (upcomingWorkouts.error) {
    console.log("❌ [DEBUG] Error in AthleteUpcomingWorkouts:", upcomingWorkouts.error);
    
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold">Kommande Träningspass</h1>
        
        {/* Debug Information */}
        <div className="mb-4 p-4 border border-yellow-500/20 rounded-lg bg-yellow-500/5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Debug Information</h3>
            <Button variant="ghost" size="sm" onClick={handleManualRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Försök igen
            </Button>
          </div>
          <div className="text-sm space-y-1">
            <p><strong>User ID:</strong> {user?.id || 'Ingen'}</p>
            <p><strong>User Email:</strong> {user?.email || 'Ingen'}</p>
            <p><strong>Auth Status:</strong> {user ? 'Inloggad' : 'Ej inloggad'}</p>
            <p><strong>Query Status:</strong> {upcomingWorkouts.status}</p>
            <p><strong>Loading:</strong> {upcomingWorkouts.isLoading ? 'Ja' : 'Nej'}</p>
          </div>
        </div>

        <div className="mt-4 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
          <p className="text-destructive font-medium mb-2">
            Ett fel uppstod när träningspassen skulle hämtas.
          </p>
          <p className="text-sm text-destructive/80 mb-4">
            Felmeddelande: {upcomingWorkouts.error?.message || 'Okänt fel'}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleManualRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Försök igen
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setShowDebug(!showDebug)}>
              <Bug className="h-4 w-4 mr-2" />
              {showDebug ? 'Dölj' : 'Visa'} debug
            </Button>
          </div>
          
          {showDebug && (
            <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
              <pre>{JSON.stringify(upcomingWorkouts.error, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!filteredWorkouts.length) {
    console.log("⚠️ [DEBUG] No filtered workouts found");
    console.log("⚠️ [DEBUG] Original data:", upcomingWorkouts.data);
    console.log("⚠️ [DEBUG] Programs found:", programs);
    console.log("⚠️ [DEBUG] Search term:", searchTerm);
    console.log("⚠️ [DEBUG] Selected program:", selectedProgram);
    
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Kommande Träningspass</h1>
          <p className="text-muted-foreground">Alla dina tillgängliga träningspass</p>
        </div>

        {/* Debug Information */}
        <div className="mb-6 p-4 border border-yellow-500/20 rounded-lg bg-yellow-500/5">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Debug Information</h3>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={handleManualRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Uppdatera
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowDebug(!showDebug)}>
                <Bug className="h-4 w-4 mr-2" />
                {showDebug ? 'Dölj' : 'Visa'} debug
              </Button>
            </div>
          </div>
          <div className="text-sm space-y-1">
            <p><strong>User ID:</strong> {user?.id || 'Ingen'}</p>
            <p><strong>User Email:</strong> {user?.email || 'Ingen'}</p>
            <p><strong>Raw Data Length:</strong> {upcomingWorkouts.data?.length || 0}</p>
            <p><strong>Programs Found:</strong> {programs.length}</p>
            <p><strong>Filtered Workouts:</strong> {filteredWorkouts.length}</p>
            <p><strong>Query Status:</strong> {upcomingWorkouts.status}</p>
          </div>
          
          {showDebug && (
            <div className="mt-4 space-y-2">
              <div>
                <p className="font-medium mb-1">Raw Query Data:</p>
                <pre className="p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                  {JSON.stringify(upcomingWorkouts.data, null, 2)}
                </pre>
              </div>
              <div>
                <p className="font-medium mb-1">Programs:</p>
                <pre className="p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                  {JSON.stringify(programs, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        <div className="text-center py-12">
          <Target className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Inga träningspass tillgängliga</h3>
          <p className="text-muted-foreground mb-4">
            Du har för närvarande inga träningspass att genomföra.
          </p>
          {upcomingWorkouts.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Detta kan bero på att du inte har tillgång till några program eller att programmen inte innehåller träningspass.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Kommande Träningspass</h1>
          <p className="text-muted-foreground">
            {filteredWorkouts.length} träningspass från {programs.length} program
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={handleManualRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Uppdatera
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowDebug(!showDebug)}>
            <Bug className="h-4 w-4 mr-2" />
            Debug
          </Button>
        </div>
      </div>

      {/* Debug Panel */}
      {showDebug && (
        <div className="p-4 border border-yellow-500/20 rounded-lg bg-yellow-500/5">
          <h3 className="font-medium mb-2">Debug Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>User ID:</strong> {user?.id}</p>
              <p><strong>User Email:</strong> {user?.email}</p>
              <p><strong>Auth Status:</strong> {user ? 'Inloggad' : 'Ej inloggad'}</p>
            </div>
            <div>
              <p><strong>Query Status:</strong> {upcomingWorkouts.status}</p>
              <p><strong>Loading:</strong> {upcomingWorkouts.isLoading ? 'Ja' : 'Nej'}</p>
              <p><strong>Data Length:</strong> {upcomingWorkouts.data?.length || 0}</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="font-medium mb-1">Raw Data:</p>
            <pre className="p-3 bg-gray-100 rounded text-xs overflow-x-auto max-h-40">
              {JSON.stringify(upcomingWorkouts.data, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Sök träningspass..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <select
          value={selectedProgram}
          onChange={(e) => setSelectedProgram(e.target.value)}
          className="px-3 py-2 border rounded-md bg-background"
        >
          <option value="">Alla program</option>
          {programs.map(program => (
            <option key={program.id} value={program.id}>
              {program.name}
            </option>
          ))}
        </select>
      </div>

      {/* Workouts grouped by program */}
      <div className="space-y-6">
        {Object.entries(groupedWorkouts).map(([programId, workouts]) => {
          const program = programs.find(p => p.id === programId);
          if (!program) return null;

          return (
            <div key={programId} className="space-y-4">
              <div className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">{program.name}</h2>
                <Badge variant="secondary">{workouts.length} pass</Badge>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {workouts.map((workout, index) => (
                  <Card key={workout.id} className="hover:shadow-md transition-shadow overflow-hidden">
                    {/* Cover Image in 16:9 Aspect Ratio */}
                    {workout.cover_image_url && (
                      <AspectRatio ratio={16 / 9}>
                        <img
                          src={workout.cover_image_url}
                          alt={workout.title}
                          className="w-full h-full object-cover"
                        />
                      </AspectRatio>
                    )}
                    
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base line-clamp-1">
                            {workout.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              Pass {index + 1}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-0">
                      {workout.short_description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {workout.short_description}
                        </p>
                      )}
                      
                        <div className="flex gap-2">
                           <Button 
                             size="sm" 
                             className="flex-1"
                             onClick={() => {
                               console.log('🔍 Navigation from upcoming workouts:', {
                                 workoutId: workout.id,
                                 programId: workout.program_id,
                                 sortOrder: workout.sort_order,
                                 workout: workout
                               });
                               navigate(`/athlete/workouts/${workout.id}?programId=${workout.program_id}&sort_order=${workout.sort_order}`);
                             }}
                           >
                             <Play className="h-4 w-4 mr-2" />
                             Visa träning
                           </Button>
                        </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}