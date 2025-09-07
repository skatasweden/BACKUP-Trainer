import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Dumbbell, Mail } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const userRole = data.user.user_metadata?.role || 'coach';
        
        toast({
          title: "Inloggning lyckades",
          description: "Du är nu inloggad",
        });
        
        // Navigate based on user role
        if (userRole === 'athlete') {
          navigate('/athlete/dashboard');
        } else {
          navigate('/coach/dashboard');
        }
      }
    } catch (error: any) {
      let errorMessage = error.message;
      
      if (error.message === 'Email not confirmed') {
        errorMessage = 'Du måste bekräfta din email först. Kolla din inkorg.';
        setShowEmailConfirmation(true);
      }
      
      toast({
        title: "Fel vid inloggning",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent, role: 'coach' | 'athlete') => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            role: role,
          }
        }
      });

      if (error) throw error;

      if (data.user) {
        setShowEmailConfirmation(true);
        toast({
          title: "Registrering lyckades",
          description: "Kolla din email för bekräftelselänk",
        });
      }
    } catch (error: any) {
      let errorMessage = error.message;
      
      if (error.message.includes('User already registered')) {
        errorMessage = 'En användare med denna email finns redan. Försök logga in istället.';
        setShowEmailConfirmation(true);
      }
      
      toast({
        title: "Fel vid registrering", 
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      toast({
        title: "Email krävs",
        description: "Ange din email för att skicka om bekräftelsen",
        variant: "destructive",
      });
      return;
    }

    setResendLoading(true);

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: window.location.origin,
        }
      });

      if (error) throw error;

      toast({
        title: "Email skickad",
        description: "Bekräftelsemail har skickats igen",
      });
    } catch (error: any) {
      toast({
        title: "Fel vid omsändning",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-card flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Dumbbell className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              FitnessPro
            </h1>
          </div>
          <p className="text-muted-foreground">
            Logga in eller skapa konto för att komma igång
          </p>
        </div>

        <Tabs defaultValue="signin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin">Logga in</TabsTrigger>
            <TabsTrigger value="signup">Skapa konto</TabsTrigger>
          </TabsList>
          
          <TabsContent value="signin">
            <Card>
              <CardHeader>
                <CardTitle>Logga in</CardTitle>
                <CardDescription>
                  Ange dina uppgifter för att logga in på ditt konto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="din@email.se"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Lösenord</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                        Loggar in...
                      </div>
                    ) : 'Logga in'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="signup">
            <Card>
              <CardHeader>
                <CardTitle>Skapa konto</CardTitle>
                <CardDescription>
                  Välj din roll och skapa ett nytt konto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="din@email.se"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Lösenord</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={(e) => handleSignUp(e, 'coach')}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          Skapar...
                        </div>
                      ) : 'Skapa Coach'}
                    </Button>
                    <Button 
                      type="button"
                      variant="outline"
                      onClick={(e) => handleSignUp(e, 'athlete')}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          Skapar...
                        </div>
                      ) : 'Skapa Atlet'}
                    </Button>
                  </div>
                  
                  {/* Instructions */}
                  <div className="text-center text-sm text-muted-foreground">
                    <p>Efter registrering kommer du få ett bekräftelsemail.</p>
                    <p>Klicka på länken för att aktivera ditt konto.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Email Confirmation Alert */}
        {showEmailConfirmation && (
          <Alert className="border-primary/20 bg-primary/5">
            <Mail className="h-4 w-4" />
            <AlertDescription className="space-y-3">
              <div>
                <p className="font-medium mb-1">Bekräfta din email</p>
                <p className="text-sm text-muted-foreground">
                  Vi har skickat en bekräftelselänk till <strong>{email}</strong>. 
                  Klicka på länken i emailen för att aktivera ditt konto.
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleResendConfirmation}
                disabled={resendLoading}
                className="w-full"
              >
                {resendLoading ? 'Skickar...' : 'Skicka om bekräftelse'}
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
}