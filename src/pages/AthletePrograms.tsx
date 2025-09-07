import { useState } from "react";
import { useAthletePrograms } from "@/hooks/usePrograms";
import { useCreatePayment } from "@/hooks/usePayment";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Play, 
  Clock, 
  User, 
  Star,
  Calendar,
  Target,
  TrendingUp,
  ShoppingCart,
  Check,
  Crown
} from "lucide-react";

// Helper function to format price with billing interval
function formatPrice(price: number, currency: string, billing_interval: string, billing_interval_count: number): string {
  const currencySymbol = currency === 'SEK' ? 'kr' : currency === 'USD' ? '$' : '€';
  
  if (billing_interval === 'one_time') {
    return `${price} ${currencySymbol}`;
  }
  
  const intervalText = billing_interval === 'monthly' ? 'mån' : 
                     billing_interval === 'weekly' ? 'vecka' : 
                     billing_interval === 'daily' ? 'dag' : billing_interval;
  
  const countText = billing_interval_count > 1 ? ` (var ${billing_interval_count}:e ${intervalText})` : '';
  
  return `${price} ${currencySymbol}/${intervalText}${countText}`;
}

const AthletePrograms = () => {
  const { programs } = useAthletePrograms();
  const createPayment = useCreatePayment();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const categories = [
    { id: "all", label: "Alla Program", icon: Target },
    { id: "strength", label: "Styrka", icon: TrendingUp },
    { id: "cardio", label: "Kondition", icon: Calendar },
    { id: "flexibility", label: "Rörlighet", icon: Star },
  ];

  const filteredPrograms = programs.data?.filter(program => {
    const matchesSearch = program.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (program.short_description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    
    // For now, show all programs regardless of category since we don't have categories in the database yet
    return matchesSearch;
  }) || [];

  const handlePurchaseProgram = async (program: any) => {
    if (!program.price) return;
    
    try {
      await createPayment.mutateAsync({
        programId: program.id,
      });
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  const handleStartProgram = (program: any) => {
    if (program.hasAccess) {
      // Navigate to upcoming workouts filtered by this program
      navigate(`/athlete/upcoming-workouts?program_id=${program.id}`);
    } else {
      // Show purchase option or access denied
      handlePurchaseProgram(program);
    }
  };

  const getRandomStats = (programId: string) => {
    // Generate consistent "random" stats based on program ID for demo purposes
    const seed = programId.charCodeAt(0) + programId.charCodeAt(1);
    return {
      duration: [4, 6, 8, 12][seed % 4],
      workouts: [8, 12, 16, 20][seed % 4],
      difficulty: ["Nybörjare", "Medel", "Avancerad"][seed % 3],
      participants: 50 + (seed % 200)
    };
  };

  if (programs.isLoading) {
    return (
      <div className="p-4 space-y-4">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="h-64">
              <CardContent className="p-4">
                <div className="bg-muted rounded-lg h-32 mb-4"></div>
                <div className="space-y-2">
                  <div className="bg-muted rounded h-4 w-3/4"></div>
                  <div className="bg-muted rounded h-3 w-full"></div>
                  <div className="bg-muted rounded h-3 w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-accent/10 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Mina Träningsprogram
              </h1>
              <p className="text-muted-foreground text-sm md:text-base">
                Program du har tillgång till och köpbara program
              </p>
            </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök träningsprogram..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50 backdrop-blur-sm border-border/50"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="whitespace-nowrap flex-shrink-0"
              >
                <category.icon className="h-4 w-4 mr-2" />
                {category.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Programs Grid */}
      <div className="p-4 max-w-4xl mx-auto">
        {filteredPrograms.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Inga program hittades</h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery ? 
                "Försök med en annan sökning eller rensa filtren." : 
                "Det finns inga tillgängliga program för tillfället."
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {filteredPrograms.map((program) => {
              const stats = getRandomStats(program.id);
              return (
                 <Card 
                   key={program.id} 
                   className={`overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-[1.02] bg-card/50 backdrop-blur-sm border-border/50 ${
                     program.hasAccess ? 'ring-2 ring-primary/20' : ''
                   }`}
                 >
                   {/* Program Image */}
                   <div className="relative h-48 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/10">
                     {program.cover_image_url ? (
                       <img
                         src={program.cover_image_url}
                         alt={program.name}
                         className="w-full h-full object-cover"
                       />
                     ) : (
                       <div className="w-full h-full flex items-center justify-center">
                         <Target className="h-12 w-12 text-primary/40" />
                       </div>
                     )}
                     
                     {/* Access Status Badge */}
                     {program.hasAccess ? (
                       <Badge 
                         variant="default" 
                         className="absolute top-3 right-3 bg-green-500 text-white"
                       >
                         <Check className="h-3 w-3 mr-1" />
                         Tillgänglig
                       </Badge>
                     ) : program.is_purchasable ? (
                       <Badge 
                         variant="secondary" 
                         className="absolute top-3 right-3 bg-blue-500 text-white"
                       >
                         <ShoppingCart className="h-3 w-3 mr-1" />
                         {program.price ? formatPrice(program.price, program.currency, program.billing_interval, program.billing_interval_count) : 'Köpbar'}
                       </Badge>
                     ) : (
                       <Badge 
                         variant="secondary" 
                         className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm"
                       >
                         {stats.difficulty}
                       </Badge>
                     )}

                     {/* Access Type Badge */}
                     {program.hasAccess && program.accessType && (
                       <Badge 
                         variant="outline" 
                         className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm"
                       >
                         {program.accessType === 'purchased' ? (
                           <>
                             <Crown className="h-3 w-3 mr-1" />
                             Köpt
                           </>
                         ) : (
                           <>
                             <User className="h-3 w-3 mr-1" />
                             Tilldelad
                           </>
                         )}
                       </Badge>
                     )}

                     {/* Participants Counter */}
                     <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-background/90 backdrop-blur-sm rounded-full px-2 py-1">
                       <User className="h-3 w-3 text-muted-foreground" />
                       <span className="text-xs font-medium">{stats.participants}</span>
                     </div>
                   </div>

                  <CardContent className="p-4 space-y-3">
                    {/* Title */}
                    <h3 className="font-bold text-lg leading-tight">{program.name}</h3>
                    
                    {/* Description */}
                    {program.short_description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {program.short_description}
                      </p>
                    )}

                    {/* Stats Row */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{stats.duration} veckor</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{stats.workouts} pass</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current text-yellow-500" />
                        <span>4.8</span>
                      </div>
                    </div>

                     {/* Action Button */}
                     {program.hasAccess ? (
                       <Button 
                         className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium"
                         size="sm"
                         onClick={() => handleStartProgram(program)}
                       >
                         <Play className="h-4 w-4 mr-2" />
                         Starta Program
                       </Button>
                     ) : program.is_purchasable && program.price ? (
                       <Button 
                         className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium"
                         size="sm"
                         onClick={() => handlePurchaseProgram(program)}
                         disabled={createPayment.isPending}
                       >
                         <ShoppingCart className="h-4 w-4 mr-2" />
                         {createPayment.isPending ? 'Behandlar...' : `Köp för ${formatPrice(program.price, program.currency, program.billing_interval, program.billing_interval_count)}`}
                       </Button>
                     ) : (
                       <Button 
                         className="w-full bg-gradient-to-r from-gray-400 to-gray-500 text-white font-medium"
                         size="sm"
                         disabled
                       >
                         Ej Tillgänglig
                       </Button>
                     )}

                     {/* Expiry Info */}
                     {program.hasAccess && program.accessExpires && (
                       <div className="text-xs text-muted-foreground mt-2 text-center">
                         Tillgång till: {new Date(program.accessExpires).toLocaleDateString('sv-SE')}
                       </div>
                     )}

                    {/* Video Badge */}
                    {program.video_url && (
                      <div className="flex justify-center">
                        <Badge variant="outline" className="text-xs">
                          <Play className="h-3 w-3 mr-1" />
                          Förhandsvisning
                        </Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Results Count */}
        {filteredPrograms.length > 0 && (
          <div className="text-center mt-8 py-4">
            <p className="text-sm text-muted-foreground">
              Visar {filteredPrograms.length} av {programs.data?.length || 0} program
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AthletePrograms;