import { useState } from "react";
import { useProgramAccess } from "@/hooks/useProgramAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { sv } from "date-fns/locale";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Calendar,
  Crown,
  User,
  Mail,
  Clock,
  Search
} from "lucide-react";

interface ProgramAccessManagerProps {
  programId: string;
  programName: string;
}

export function ProgramAccessManager({ programId, programName }: ProgramAccessManagerProps) {
  const { 
    programAccess, 
    availableAthletes, 
    assignProgram, 
    removeAccess, 
    updateAccess 
  } = useProgramAccess(programId);
  
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [selectedAthlete, setSelectedAthlete] = useState<string>("");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");

  const handleAssignProgram = async () => {
    if (!selectedAthlete) {
      toast({
        title: "Fel",
        description: "Välj en atlet att tilldela programmet till",
        variant: "destructive",
      });
      return;
    }

    try {
      await assignProgram.mutateAsync({
        athleteId: selectedAthlete,
        expires_at: expiryDate || undefined,
      });
      
      setShowAssignDialog(false);
      setSelectedAthlete("");
      setExpiryDate("");
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleRemoveAccess = async (accessId: string) => {
    try {
      await removeAccess.mutateAsync(accessId);
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const handleUpdateExpiry = async (accessId: string, newExpiry: string) => {
    try {
      await updateAccess.mutateAsync({
        accessId,
        expires_at: newExpiry || undefined,
      });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  // Filter available athletes based on search
  const filteredAthletes = availableAthletes.data?.filter(athlete => 
    athlete.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    athlete.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Athletes who don't have access yet
  const unassignedAthletes = filteredAthletes.filter(athlete => !athlete.access_type);

  if (programAccess.isLoading || availableAthletes.isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Program Åtkomst
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Laddar åtkomstinformation...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (availableAthletes.error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Program Åtkomst - Fel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-sm text-destructive mb-2">
              Fel vid laddning av atleter: {availableAthletes.error.message}
            </p>
            <Button onClick={() => availableAthletes.refetch()} variant="outline" size="sm">
              Försök igen
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const accessList = programAccess.data || [];
  const athletesList = availableAthletes.data || [];

  return (
    <div className="space-y-6">
      {/* Current Access */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Program Åtkomst ({accessList.length})
            </CardTitle>
            
            <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Tilldela Atlet
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Tilldela Program</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="athlete">Välj Atlet</Label>
                    <Select value={selectedAthlete} onValueChange={setSelectedAthlete}>
                      <SelectTrigger>
                        <SelectValue placeholder="Välj en atlet..." />
                      </SelectTrigger>
                      <SelectContent className="z-50 bg-popover">
                        {unassignedAthletes.length === 0 ? (
                          <div className="px-3 py-2 text-sm text-muted-foreground">
                            {availableAthletes.isLoading ? "Laddar atleter..." : "Inga tillgängliga atleter"}
                          </div>
                        ) : (
                          unassignedAthletes.map((athlete) => (
                            <SelectItem key={athlete.user_id} value={athlete.user_id}>
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <div>
                                  <div className="font-medium">{athlete.email}</div>
                                  {athlete.full_name && (
                                    <div className="text-sm text-muted-foreground">
                                      {athlete.full_name}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="expiry">Utgångsdatum (valfritt)</Label>
                    <Input
                      id="expiry"
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleAssignProgram}
                      disabled={assignProgram.isPending}
                      className="flex-1"
                    >
                      {assignProgram.isPending ? "Tilldelar..." : "Tilldela"}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowAssignDialog(false)}
                      className="flex-1"
                    >
                      Avbryt
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {accessList.length === 0 ? (
            <div className="text-center py-6">
              <Users className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                Inga atleter har tillgång till detta program än
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {accessList.map((access: any) => (
                <div 
                  key={access.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {access.access_type === 'purchased' ? (
                        <Crown className="h-4 w-4 text-yellow-500" />
                      ) : (
                        <User className="h-4 w-4 text-blue-500" />
                      )}
                      <div>
                        <div className="font-medium">
                          {access.profiles?.email || 'Okänd användare'}
                        </div>
                        {access.profiles?.full_name && (
                          <div className="text-sm text-muted-foreground">
                            {access.profiles.full_name}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Badge variant={access.access_type === 'purchased' ? 'default' : 'secondary'}>
                        {access.access_type === 'purchased' ? 'Köpt' : 'Tilldelad'}
                      </Badge>
                      
                      {access.expires_at && (
                        <Badge variant="outline" className="text-xs">
                          <Clock className="h-3 w-3 mr-1" />
                          Utgår {new Date(access.expires_at).toLocaleDateString('sv-SE')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(access.created_at), { 
                        addSuffix: true, 
                        locale: sv 
                      })}
                    </div>
                    
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Ta bort behörighet</AlertDialogTitle>
                          <AlertDialogDescription>
                            Är du säker på att du vill ta bort {access.profiles?.email}s behörighet för detta program?
                            {access.access_type === 'purchased' 
                              ? ' Atleten har köpt detta program och kommer att förlora tillgången. De måste köpa igen för att få tillgång.' 
                              : ' Atleten kommer inte längre att kunna se eller använda detta program.'
                            }
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleRemoveAccess(access.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Ta bort behörighet
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Athletes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Alla Atleter ({athletesList.length})
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Sök atleter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredAthletes.map((athlete) => (
              <div 
                key={athlete.user_id}
                className="flex items-center justify-between p-2 border rounded"
              >
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium text-sm">{athlete.email}</div>
                    {athlete.full_name && (
                      <div className="text-xs text-muted-foreground">
                        {athlete.full_name}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {athlete.access_type ? (
                    <Badge 
                      variant={athlete.access_type === 'purchased' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {athlete.access_type === 'purchased' ? 'Köpt' : 'Tilldelad'}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      Ingen åtkomst
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}