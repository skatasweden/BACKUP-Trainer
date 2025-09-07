import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  Users, 
  Settings, 
  Trash2, 
  Key, 
  Mail, 
  Search,
  RefreshCw
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { updateUserEmail, updateUserPassword, deleteUser } from "@/lib/api/admin";

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  role: 'coach' | 'athlete';
  created_at: string;
}

const CoachAdmin = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const { toast } = useToast();

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      // Direct query to profiles table with type assertion
      const { data, error } = await supabase
        .from('profiles' as any)
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProfiles((data as unknown as Profile[]) || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Fel",
        description: "Kunde inte hämta användare",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const filteredProfiles = profiles.filter(profile => 
    profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChangeEmail = async (userId: string, newEmail: string) => {
    try {
      await updateUserEmail(userId, newEmail);

      toast({
        title: "Framgång",
        description: "Email har uppdaterats"
      });
      
      fetchProfiles();
      setSelectedUser(null);
      setNewEmail('');
    } catch (error: any) {
      console.error('Error updating email:', error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte uppdatera email.",
        variant: "destructive"
      });
    }
  };

  const handleChangePassword = async (userId: string, newPassword: string) => {
    try {
      await updateUserPassword(userId, newPassword);

      toast({
        title: "Framgång",
        description: "Lösenord har uppdaterats"
      });
      
      setSelectedUser(null);
      setNewPassword('');
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte uppdatera lösenord.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser(userId);

      toast({
        title: "Framgång",
        description: "Användare har raderats"
      });
      
      fetchProfiles();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: "Fel",
        description: error.message || "Kunde inte radera användare.",
        variant: "destructive"
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === 'coach' ? 'default' : 'secondary';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            Admin Panel
          </h1>
          <p className="text-muted-foreground">Hantera användarkonton och lös supportärenden</p>
        </div>
        <Button onClick={fetchProfiles} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Uppdatera
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Sök efter email, namn eller roll..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Användare ({filteredProfiles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Namn</TableHead>
                  <TableHead>Roll</TableHead>
                  <TableHead>Skapad</TableHead>
                  <TableHead>Åtgärder</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.email}</TableCell>
                    <TableCell>{profile.full_name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(profile.role)}>
                        {profile.role === 'coach' ? 'Coach' : 'Atlet'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(profile.created_at).toLocaleDateString('sv-SE')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {/* Change Email Dialog */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedUser(profile);
                                setNewEmail(profile.email);
                              }}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Ändra Email</DialogTitle>
                              <DialogDescription>
                                Ändra email för {profile.email}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="new-email">Ny Email</Label>
                                <Input
                                  id="new-email"
                                  type="email"
                                  value={newEmail}
                                  onChange={(e) => setNewEmail(e.target.value)}
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  onClick={() => setSelectedUser(null)}
                                >
                                  Avbryt
                                </Button>
                                <Button 
                                  onClick={() => handleChangeEmail(profile.user_id, newEmail)}
                                  disabled={!newEmail || newEmail === profile.email}
                                >
                                  Uppdatera
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* Change Password Dialog */}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setSelectedUser(profile)}
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Ändra Lösenord</DialogTitle>
                              <DialogDescription>
                                Sätt nytt lösenord för {profile.email}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="new-password">Nytt Lösenord</Label>
                                <Input
                                  id="new-password"
                                  type="password"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  placeholder="Minst 6 tecken"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant="outline" 
                                  onClick={() => {
                                    setSelectedUser(null);
                                    setNewPassword('');
                                  }}
                                >
                                  Avbryt
                                </Button>
                                <Button 
                                  onClick={() => handleChangePassword(profile.user_id, newPassword)}
                                  disabled={!newPassword || newPassword.length < 6}
                                >
                                  Uppdatera
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* Delete User Dialog */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Radera Användare</AlertDialogTitle>
                              <AlertDialogDescription>
                                Är du säker på att du vill radera användaren <strong>{profile.email}</strong>? 
                                Detta går inte att ångra och all data kommer att tas bort.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Avbryt</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDeleteUser(profile.user_id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Radera
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Security Info */}
      <Card className="border-green-500">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Settings className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-green-600">Server-secured</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Admin-funktioner körs nu säkert via Edge Function med RBAC-kontroll. 
                Endast coaches med can_manage_users-behörighet kan använda dessa funktioner.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CoachAdmin;