import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Dumbbell, 
  Calendar, 
  BarChart3, 
  Plus, 
  Target,
  ClipboardList,
  Settings
} from "lucide-react";

const CoachDashboard = React.memo(() => {
  const stats = useMemo(() => [
    {
      title: "Aktiva Atleter",
      value: "24",
      change: "+3 denna vecka",
      icon: Users,
      color: "text-primary"
    },
    {
      title: "Program Skapad",
      value: "12",
      change: "+2 denna månad", 
      icon: ClipboardList,
      color: "text-success"
    },
    {
      title: "Övningar",
      value: "156",
      change: "+8 nya",
      icon: Dumbbell,
      color: "text-accent"
    },
    {
      title: "Avslutade Pass",
      value: "342",
      change: "+45 denna vecka",
      icon: Target,
      color: "text-warning"
    }
  ], []);

  const quickActions = useMemo(() => [
    {
      title: "Ny Övning",
      description: "Skapa en ny övning med instruktioner",
      icon: Dumbbell,
      href: "/coach/exercises",
      variant: "hero" as const
    },
    {
      title: "Nytt Program",
      description: "Bygg ett komplett träningsprogram",
      icon: ClipboardList,
      href: "/coach/programs", 
      variant: "default" as const
    },
    {
      title: "Admin Panel",
      description: "Hantera användarkonton och support",
      icon: Settings,
      href: "/coach/admin",
      variant: "secondary" as const
    },
    {
      title: "Protokoll",
      description: "Definiera sets, reps och vila",
      icon: BarChart3,
      href: "/coach/protocols",
      variant: "secondary" as const
    }
  ], []);

  const recentActivities = useMemo(() => [
    { action: "Sara K. avslutade Pass 3 av 'Styrka Grund'", time: "2 tim sedan" },
    { action: "Nytt program 'Kondition Pro' skapades", time: "5 tim sedan" },
    { action: "Marcus L. började 'Bulking Program'", time: "1 dag sedan" },
    { action: "3 nya övningar lades till", time: "2 dagar sedan" }
  ], []);

  const popularPrograms = useMemo(() => [
    { name: "Styrka Grund", athletes: 8, completion: 85 },
    { name: "Kondition Pro", athletes: 6, completion: 72 },
    { name: "Bulking Program", athletes: 4, completion: 90 },
    { name: "Cutting Plan", athletes: 6, completion: 68 }
  ], []);

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Coach Dashboard</h1>
          <p className="text-muted-foreground">Välkommen tillbaka! Här är en översikt av din verksamhet.</p>
        </div>
        <Button variant="default" size="lg" className="bg-primary hover:bg-primary/90 shadow-sm">
          <Plus className="h-5 w-5 mr-2" />
          Skapa Program
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

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Snabbåtgärder</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <Card key={action.title} className="card-elevated p-6 will-change-transform hover:transform hover:scale-[1.02] transition-transform duration-200 cursor-pointer">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 rounded-full bg-secondary">
                  <action.icon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">{action.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{action.description}</p>
                  <Button variant={action.variant} size="sm" className="w-full">
                    Öppna
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
            <Calendar className="h-5 w-5 text-primary" />
            Senaste Aktivitet
          </h3>
          <div className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <p className="text-sm">{activity.action}</p>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="card-elevated p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Populära Program
          </h3>
          <div className="space-y-4">
            {popularPrograms.map((program) => (
              <div key={program.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{program.name}</span>
                  <span className="text-muted-foreground">{program.athletes} atleter</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-primary h-2 rounded-full" 
                    style={{ width: `${program.completion}%` }}
                  ></div>
                </div>
                <div className="text-xs text-muted-foreground">{program.completion}% genomförd</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
});

export default CoachDashboard;