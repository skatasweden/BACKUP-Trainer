import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  ClipboardList,
  BarChart3,
  Settings,
  Target,
  Calendar,
  MessageCircle,
  Trophy,
  Home,
  Tags,
  Clock,
  LogOut,
  User
} from "lucide-react";

const coachItems = [
  { title: "Dashboard", url: "/coach/dashboard", icon: LayoutDashboard },
  { title: "Kategorier", url: "/coach/categories", icon: Tags },
  { title: "Övningar", url: "/coach/exercises", icon: Dumbbell },
  { title: "Protokoll", url: "/coach/protocols", icon: BarChart3 },
  { title: "Block", url: "/coach/blocks", icon: ClipboardList },
  { title: "Träningspass", url: "/coach/workouts", icon: Calendar },
  { title: "Program", url: "/coach/programs", icon: Target },
  { title: "Atleter", url: "/coach/athletes", icon: Users },
];

const athleteItems = [
  { title: "Dashboard", url: "/athlete/dashboard", icon: LayoutDashboard },
  { title: "Mina Program", url: "/athlete/programs", icon: Target },
  { title: "Kommande Pass", url: "/athlete/upcoming-workouts", icon: Clock },
  { title: "Träningspass", url: "/athlete/workouts", icon: Calendar },
  { title: "Progression", url: "/athlete/progress", icon: Trophy },
  { title: "Chat", url: "/athlete/chat", icon: MessageCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const { user, signOut } = useAuth();
  
  // Determine if we're in coach or athlete mode
  const isCoach = currentPath.includes("/coach");
  const isAthlete = currentPath.includes("/athlete");
  const items = isCoach ? coachItems : athleteItems;
  const roleTitle = isCoach ? "Coach" : isAthlete ? "Atlet" : "FitnessPro";
  const isCollapsed = state === "collapsed";
  
  const isActive = (path: string) => currentPath === path;
  
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary/10 text-primary border-r-2 border-primary font-medium" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";

  return (
    <Sidebar
      collapsible="icon"
    >
      <SidebarContent className="bg-card border-r border-border">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <NavLink to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-primary to-primary-glow flex items-center justify-center">
              <Dumbbell className="h-5 w-5 text-primary-foreground" />
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="font-bold text-lg">FitnessPro</h2>
                <p className="text-xs text-muted-foreground">{roleTitle}</p>
              </div>
            )}
          </NavLink>
        </div>

        {/* Navigation */}
        <SidebarGroup
          className="flex-1"
        >
          <SidebarGroupLabel>{isCoach ? "Coach Verktyg" : isAthlete ? "Träning" : "Navigation"}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="w-full">
                    <NavLink 
                      to={item.url} 
                      end 
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${getNavCls({ isActive })}`
                      }
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* User Account Section */}
        <div className="p-4 border-t border-border space-y-2">
          {user && (
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src="" />
                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.email}</p>
                  <p className="text-xs text-muted-foreground">{roleTitle}</p>
                </div>
              )}
            </div>
          )}
          
          <div className="space-y-1">
            <SidebarMenuButton asChild className="w-full">
              <NavLink 
                to="/" 
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <Home className="h-5 w-5 text-muted-foreground" />
                {!isCollapsed && <span className="text-sm text-muted-foreground">Tillbaka till Start</span>}
              </NavLink>
            </SidebarMenuButton>
            
            {user && (
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="w-full justify-start gap-3 px-3 py-2 h-auto text-muted-foreground hover:text-foreground"
              >
                <LogOut className="h-5 w-5" />
                {!isCollapsed && <span className="text-sm">Logga ut</span>}
              </Button>
            )}
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}