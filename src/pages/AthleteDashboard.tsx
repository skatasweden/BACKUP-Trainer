import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Calendar, 
  Trophy, 
  TrendingUp, 
  Play,
  CheckCircle,
  Clock,
  Star,
  MessageCircle
} from "lucide-react";

const AthleteDashboard = () => {
  const stats = [
    {
      title: "Avklarade Pass",
      value: "28",
      change: "+4 denna vecka",
      icon: CheckCircle,
      color: "text-success"
    },
    {
      title: "Aktiva Program",
      value: "3",
      change: "2 pågående",
      icon: Target,
      color: "text-primary"
    },
    {
      title: "Träningsdagar",
      value: "12",
      change: "Denna månad",
      icon: Calendar,
      color: "text-accent"
    },
    {
      title: "Streak",
      value: "5",
      change: "Dagar i rad",
      icon: Trophy,
      color: "text-warning"
    }
  ];

  const activePrograms = [
    {
      id: 1,
      title: "Styrka Grund",
      coach: "Marcus Trainer",
      progress: 65,
      nextWorkout: "Pass 8: Överkropp A",
      workouts: 12,
      completed: 8,
      status: "active"
    },
    {
      id: 2,
      title: "Kondition Pro",
      coach: "Sara Coach",
      progress: 30,
      nextWorkout: "Pass 4: HIIT Cardio",
      workouts: 16,
      completed: 5,
      status: "active"
    },
    {
      id: 3,
      title: "Mobility & Recovery",
      coach: "Anna Wellness",
      progress: 80,
      nextWorkout: "Pass 9: Stretching",
      workouts: 10,
      completed: 8,
      status: "almost_done"
    }
  ];

  const recentWorkouts = [
    {
      program: "Styrka Grund",
      workout: "Pass 7: Ben & Gluteus",
      date: "Idag",
      duration: "45 min",
      status: "completed"
    },
    {
      program: "Kondition Pro", 
      workout: "Pass 3: Löpintervaller",
      date: "Igår",
      duration: "30 min",
      status: "completed"
    },
    {
      program: "Mobility & Recovery",
      workout: "Pass 8: Yoga Flow",
      date: "2 dagar sedan",
      duration: "25 min",
      status: "completed"
    }
  ];

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Min Träning</h1>
          <p className="text-muted-foreground">Dags att träna! Välj ett program att fortsätta med.</p>
        </div>
        <Button variant="hero" size="lg">
          <MessageCircle className="h-5 w-5 mr-2" />
          Kontakta Coach
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="card-elevated p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </div>
              <div className={`p-3 rounded-full bg-secondary ${stat.color}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Active Programs */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Mina Program</h2>
          <Button variant="outline">
            Visa Alla Program
          </Button>
        </div>
        
        <div className="grid gap-6">
          {activePrograms.map((program) => (
            <Card key={program.id} className="card-elevated p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{program.title}</h3>
                    <Badge variant={program.status === "almost_done" ? "secondary" : "default"}>
                      {program.status === "almost_done" ? "Nästan klar" : "Aktiv"}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3">
                    Coach: {program.coach}
                  </p>
                  
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-success" />
                      {program.completed}/{program.workouts} pass
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-primary to-primary-glow h-2 rounded-full" 
                          style={{ width: `${program.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">{program.progress}%</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    Nästa: {program.nextWorkout}
                  </div>
                </div>
                
                <div className="ml-6">
                  <Button variant="hero">
                    <Play className="h-4 w-4 mr-2" />
                    Fortsätt
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="card-elevated p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Senaste Träningspassen
          </h3>
          <div className="space-y-4">
            {recentWorkouts.map((workout, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                <div>
                  <p className="font-medium text-sm">{workout.workout}</p>
                  <p className="text-xs text-muted-foreground">{workout.program}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{workout.date}</p>
                  <p className="text-xs text-muted-foreground">{workout.duration}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="card-elevated p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            Prestationsöversikt
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Veckans Mål</span>
                <span>4/5 pass</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-gradient-to-r from-success to-primary h-2 rounded-full w-4/5"></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Månatlig Konsistens</span>
                <span>85%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-2">
                <div className="bg-gradient-to-r from-primary to-accent h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between text-sm">
                <span>Personliga Rekord</span>
                <Badge variant="secondary">+3 denna månad</Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AthleteDashboard;