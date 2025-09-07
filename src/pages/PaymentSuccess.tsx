import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useCheckPaymentStatus } from "@/hooks/usePayment";
import { useHasProgramAccess } from "@/hooks/useProgramAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";

type PageState = 'loading' | 'success' | 'error' | 'already_has_access';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const checkPaymentStatus = useCheckPaymentStatus();
  const [pageState, setPageState] = useState<PageState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [hasAttempted, setHasAttempted] = useState(false);

  const sessionId = searchParams.get('session_id');
  const programId = searchParams.get('program_id');
  
  // Check if user already has access to the program
  const { data: hasAccess, isLoading: checkingAccess, refetch: refetchAccess } = useHasProgramAccess(programId || '');

  console.log('[PAYMENT-SUCCESS] Page loaded:', { sessionId, programId, hasAccess, checkingAccess });

  const checkStatus = useCallback(async () => {
    if (!programId) {
      console.error('[PAYMENT-SUCCESS] Missing program ID');
      setErrorMessage('Saknar program ID för att kontrollera status');
      setPageState('error');
      return;
    }

    console.log('[PAYMENT-SUCCESS] Checking payment status from database');
    setDebugInfo({ sessionId, programId, timestamp: Date.now() });

    try {
      // Wait a moment for webhook to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check database for payment status (webhook should have updated it)
      const result = await checkPaymentStatus.mutateAsync({ programId });
      
      if (result.hasAccess) {
        console.log('[PAYMENT-SUCCESS] Payment confirmed, user has access');
        setPageState('success');
        // Refresh access status
        refetchAccess();
      } else {
        console.log('[PAYMENT-SUCCESS] Payment not found in database yet, may need more time');
        setErrorMessage('Betalningen kunde inte hittas. Webhooks kanske tar lite tid att behandla.');
        setPageState('error');
      }
    } catch (error: any) {
      console.error('[PAYMENT-SUCCESS] Status check failed:', error);
      setErrorMessage(error.message || 'Kunde inte kontrollera betalningsstatus');
      setPageState('error');
    }
  }, [sessionId, programId, checkPaymentStatus, refetchAccess]);

  useEffect(() => {
    // Don't start verification if we're still checking access or missing params
    if (!programId) {
      setErrorMessage('Saknar program ID');
      setPageState('error');
      return;
    }

    if (checkingAccess) {
      console.log('[PAYMENT-SUCCESS] Still checking if user has access...');
      return;
    }

    // If user already has access, show success
    if (hasAccess) {
      console.log('[PAYMENT-SUCCESS] User already has access to program');
      setPageState('already_has_access');
      return;
    }

    // Only attempt verification once
    if (hasAttempted) {
      console.log('[PAYMENT-SUCCESS] Status check already attempted, skipping');
      return;
    }

    console.log('[PAYMENT-SUCCESS] Starting status check process');
    setHasAttempted(true);

    // Set a timeout for verification (30 seconds)
    const timeoutId = setTimeout(() => {
      console.error('[PAYMENT-SUCCESS] Status check timeout');
      setErrorMessage('Statuskontrollen tog för lång tid. Webhooks kanske tar tid att behandla.');
      setPageState('error');
    }, 30000);

    // Start status check
    checkStatus();

    return () => clearTimeout(timeoutId);
  }, [programId, hasAccess, checkingAccess, hasAttempted, checkStatus]);

  const handleContinue = () => {
    navigate('/athlete/programs');
  };

  // Loading state
  if (pageState === 'loading' || checkingAccess || checkPaymentStatus.isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Kontrollerar betalning...</h2>
            <p className="text-muted-foreground">
              Vi kontrollerar din betalning från databasen (webhook-driven).
            </p>
            {Object.keys(debugInfo).length > 0 && (
              <div className="mt-4 p-2 bg-muted/30 rounded text-xs text-left">
                <strong>Debug:</strong> {JSON.stringify(debugInfo, null, 2)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (pageState === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-xl">Betalningskontroll Misslyckades</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              {errorMessage || 'Vi kunde inte hitta din betalning i databasen. Webhooks kanske tar tid att behandla. Om pengar har dragits från ditt konto, kontakta vår support.'}
            </p>
            {!sessionId && <p className="text-sm text-muted-foreground">Saknar session ID (detta är okej för webhook-driven flöde)</p>}
            {!programId && <p className="text-sm text-muted-foreground">Saknar program ID</p>}
            <div className="space-y-2">
              <Button onClick={handleContinue} className="w-full">
                Gå till Mina Program
              </Button>
              <Button variant="outline" onClick={() => navigate('/support')} className="w-full">
                Kontakta Support
              </Button>
              <Button variant="ghost" onClick={() => window.location.reload()} className="w-full text-xs">
                Försök igen
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Already has access state
  if (pageState === 'already_has_access') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <CardTitle className="text-xl">Du har redan tillgång!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Du har redan tillgång till detta program. Du kan börja träna direkt!
            </p>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="text-sm font-medium">Vad kan du göra nu?</p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• Gå till dina program för att börja träna</li>
                <li>• Kontakta support om du har frågor om betalningen</li>
              </ul>
            </div>
            <Button onClick={handleContinue} className="w-full">
              Gå till Mina Program
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <CardTitle className="text-xl">Betalning Genomförd!</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Tack för ditt köp! Du har nu tillgång till programmet och kan börja träna direkt.
          </p>
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium">Vad händer nu?</p>
            <ul className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>• Programmet är nu tillgängligt i dina program</li>
              <li>• Du får ett bekräftelsemail på din registrerade adress</li>
              <li>• Du kan börja träna direkt</li>
            </ul>
          </div>
          <Button onClick={handleContinue} className="w-full">
            Starta Träning
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}