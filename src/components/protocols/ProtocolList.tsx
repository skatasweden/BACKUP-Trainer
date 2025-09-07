import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, ExternalLink } from "lucide-react";
import { useProtocols } from "@/hooks/useProtocols";
import { useToast } from "@/hooks/use-toast";
import React from "react";

interface ProtocolListProps {
  onEdit: (protocol: any) => void;
}

export function ProtocolList({ onEdit }: ProtocolListProps) {
  const { protocols, deleteProtocol } = useProtocols();
  const { toast } = useToast();

  // Lägg till useEffect för att logga när protocols.data ändras
  React.useEffect(() => {
    console.log("🔍 ProtocolList: protocols.data ändrades:", protocols.data);
    console.log("🔍 ProtocolList: isLoading:", protocols.isLoading);
    console.log("🔍 ProtocolList: isFetching:", protocols.isFetching);
  }, [protocols.data, protocols.isLoading, protocols.isFetching]);

  const handleDelete = async (id: string) => {
    if (window.confirm("Är du säker på att du vill ta bort detta protokoll?")) {
      try {
        await deleteProtocol.mutateAsync(id);
        toast({ title: "Protokoll borttaget!" });
      } catch (error) {
        toast({ 
          title: "Fel", 
          description: "Kunde inte ta bort protokollet",
          variant: "destructive" 
        });
      }
    }
  };

  console.log("🔍 ProtocolList: Rendererar med data:", protocols.data);
  console.log("🔍 ProtocolList: Query state:", { 
    isLoading: protocols.isLoading, 
    isFetching: protocols.isFetching,
    dataLength: protocols.data?.length 
  });

  if (protocols.isLoading || protocols.isFetching) {
    return (
      <div className="text-center py-8">
        {protocols.isLoading ? "Laddar protokoll..." : "Uppdaterar protokoll..."}
      </div>
    );
  }

  if (!protocols.data?.length) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center text-muted-foreground">
            <p className="text-lg mb-2">Inga protokoll ännu</p>
            <p>Skapa ditt första protokoll för att komma igång</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {protocols.data.map((protocol: any) => (
        <Card key={protocol.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-lg">{protocol.name}</CardTitle>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(protocol)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(protocol.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {protocol.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {protocol.description}
              </p>
            )}
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">
                {protocol.sets} sets
              </Badge>
              <Badge variant="secondary">
                {protocol.repetitions} reps
              </Badge>
              <Badge variant="secondary">
                {protocol.intensity_value}
                {protocol.intensity_type === 'percentage' ? '%' : '/10'}
              </Badge>
            </div>

            {protocol.youtube_url && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => window.open(protocol.youtube_url, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Visa Video
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}