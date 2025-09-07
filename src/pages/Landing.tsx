import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Target, Dumbbell, TrendingUp, ShoppingCart, Play, Star, Calendar, Clock, User } from "lucide-react";
import heroImage from "@/assets/hero-fitness.jpg";
import { usePublicPrograms } from "@/hooks/usePublicPrograms";
import { useAuth } from "@/contexts/AuthContext";
import { useCreatePayment } from "@/hooks/usePayment";

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

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { programs } = usePublicPrograms();
  const createPayment = useCreatePayment();
  const [selectedRole, setSelectedRole] = useState<"coach" | "athlete" | null>(null);

  const handleRoleSelect = (role: "coach" | "athlete") => {
    setSelectedRole(role);
    setTimeout(() => {
      navigate('/auth');
    }, 300);
  };

  const handlePurchaseProgram = async (program: any) => {
    if (!user) {
      // Store the program ID in sessionStorage and redirect to auth
      sessionStorage.setItem('pendingPurchase', program.id);
      navigate('/auth');
      return;
    }

    if (!program.price) return;
    
    try {
      await createPayment.mutateAsync({
        programId: program.id,
      });
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  const getRandomStats = (programId: string) => {
    // Generate consistent "random" stats based on program ID for demo purposes
    const seed = programId.charCodeAt(0) + programId.charCodeAt(1);
    return {
      duration: [4, 6, 8, 12][seed % 4],
      workouts: [8, 12, 16, 20][seed % 4],
      difficulty: ["Nybörjare", "Medel", "Avancerad"][seed % 3],
      participants: 50 + (seed % 200),
      rating: (4.2 + (seed % 8) / 10).toFixed(1)
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex flex-col relative overflow-hidden">
      {/* Background Hero Image */}
      <div 
        className="absolute inset-0 opacity-10 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/90 to-background/95" />
      {/* Header */}
      <header className="flex justify-between items-center p-6 relative z-10">
        <div className="flex items-center gap-2">
          <Dumbbell className="h-8 w-8 text-primary" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            FitnessPro
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/auth')}
            className="text-foreground hover:text-primary"
          >
            Logga in
          </Button>
          <Button 
            variant="default" 
            onClick={() => navigate('/auth')}
          >
            Skapa konto
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <div className="flex-1 flex items-center justify-center px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-12">
            <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              Träning som fungerar
            </h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Professionell träningsplattform för coacher och atleter. 
              Skapa, administrera och följ träningsprogram med precision.
            </p>
          </div>

          {/* Role Selection Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Coach Card */}
            <Card 
              className={`card-elevated p-8 cursor-pointer transition-all duration-300 hover:scale-105 border-2 ${
                selectedRole === "coach" ? "border-primary shadow-glow" : "border-border"
              }`}
              onClick={() => handleRoleSelect("coach")}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-primary-glow flex items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">Coach</h3>
                <p className="text-muted-foreground mb-6">
                  Skapa träningsprogram, hantera atleter och följ progression.
                </p>
                <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Bygg övningar och program
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Administrera protokoll
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                    Följ atleters framsteg
                  </li>
                </ul>
                <Button variant="hero" size="lg" className="w-full">
                  Välj Coach
                </Button>
              </div>
            </Card>

            {/* Athlete Card */}
            <Card 
              className={`card-elevated p-8 cursor-pointer transition-all duration-300 hover:scale-105 border-2 ${
                selectedRole === "athlete" ? "border-primary shadow-glow" : "border-border"
              }`}
              onClick={() => handleRoleSelect("athlete")}
            >
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-accent to-primary flex items-center justify-center mb-4">
                  <Target className="h-8 w-8 text-primary-foreground" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">Atlet</h3>
                <p className="text-muted-foreground mb-6">
                  Följ träningsprogram och spåra din utveckling över tid.
                </p>
                <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                    Köp och följ program
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                    Spåra progression
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-accent rounded-full"></div>
                    Kommunicera med coach
                  </li>
                </ul>
                <Button variant="default" size="lg" className="w-full">
                  Välj Atlet
                </Button>
              </div>
            </Card>
          </div>

          {/* Features Section */}
          <div className="mt-16 grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="text-center p-6">
              <TrendingUp className="h-12 w-12 text-primary mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Progression</h4>
              <p className="text-sm text-muted-foreground">
                Spåra framsteg och optimera träning
              </p>
            </div>
            <div className="text-center p-6">
              <Dumbbell className="h-12 w-12 text-primary mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Flexibilitet</h4>
              <p className="text-sm text-muted-foreground">
                Anpassa program efter individuella behov
              </p>
            </div>
            <div className="text-center p-6">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h4 className="font-semibold mb-2">Kommunikation</h4>
              <p className="text-sm text-muted-foreground">
                Direkt kontakt mellan coach och atlet
              </p>
            </div>
          </div>

          {/* Programs Marketplace Section */}
          {programs.data && programs.data.length > 0 && (
            <div className="mt-20">
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold mb-4 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                  Tillgängliga Träningsprogram
                </h3>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Välj bland våra professionellt utformade träningsprogram och börja din fitness-resa idag.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {programs.data.slice(0, 6).map((program) => {
                  const stats = getRandomStats(program.id);
                  return (
                    <Card 
                      key={program.id} 
                      className="overflow-hidden hover:shadow-glow transition-all duration-300 hover:scale-[1.02] bg-card/80 backdrop-blur-sm border border-border/50"
                    >
                      {/* Program Image */}
                      <div className="relative h-40 bg-gradient-to-br from-primary/20 via-accent/10 to-primary/10">
                        {program.cover_image_url ? (
                          <img
                            src={program.cover_image_url}
                            alt={program.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Target className="h-10 w-10 text-primary/40" />
                          </div>
                        )}
                        
                        {/* Price Badge */}
                        {program.price && (
                          <Badge 
                            variant="secondary" 
                            className="absolute top-3 right-3 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-semibold"
                          >
                            {formatPrice(program.price, program.currency, program.billing_interval, program.billing_interval_count)}
                          </Badge>
                        )}

                        {/* Difficulty Badge */}
                        <Badge 
                          variant="outline" 
                          className="absolute top-3 left-3 bg-background/90 backdrop-blur-sm"
                        >
                          {stats.difficulty}
                        </Badge>

                        {/* Participants Counter */}
                        <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-background/90 backdrop-blur-sm rounded-full px-2 py-1">
                          <User className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-medium">{stats.participants}</span>
                        </div>
                      </div>

                      <CardContent className="p-4 space-y-3">
                        {/* Title */}
                        <h4 className="font-bold text-lg leading-tight line-clamp-2">{program.name}</h4>
                        
                        {/* Description */}
                        {program.short_description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                            {program.short_description}
                          </p>
                        )}

                        {/* Stats Row */}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{stats.duration}v</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{stats.workouts} pass</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current text-yellow-500" />
                            <span className="font-medium">{stats.rating}</span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <Button 
                          className="w-full bg-gradient-to-r from-primary to-primary-glow hover:from-primary-glow hover:to-primary text-primary-foreground font-medium"
                          size="sm"
                          onClick={() => handlePurchaseProgram(program)}
                          disabled={createPayment.isPending}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          {user ? (
                            createPayment.isPending ? 'Behandlar...' : 'Köp Nu'
                          ) : 'Logga in för att köpa'}
                        </Button>

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

              {/* View All Programs CTA */}
              {programs.data.length > 6 && (
                <div className="text-center mt-8">
                  <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={() => navigate('/athlete/programs')}
                    className="bg-background/50 backdrop-blur-sm border-border/50 hover:bg-background/80"
                  >
                    Visa alla {programs.data.length} program
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Landing;