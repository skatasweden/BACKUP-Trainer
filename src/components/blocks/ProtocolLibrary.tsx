import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Target } from "lucide-react";
import { useProtocols } from "@/hooks/useProtocols";
import { Badge } from "@/components/ui/badge";

interface ProtocolItemProps {
  protocol: {
    id: string;
    name: string;
    description?: string;
    sets?: number;
    repetitions?: number;
    intensity_value?: number;
    intensity_type?: string;
  };
}

function ProtocolItem({ protocol }: ProtocolItemProps) {
  return (
    <Card className="hover:shadow-md transition-shadow"
    >
      <CardContent className="p-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Target className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm truncate">{protocol.name}</h4>
            {protocol.description && (
              <p className="text-xs text-muted-foreground truncate mt-1">
                {protocol.description}
              </p>
            )}
            <div className="flex flex-wrap gap-1 mt-2">
              {protocol.sets && (
                <Badge variant="secondary" className="text-xs">
                  {protocol.sets} sets
                </Badge>
              )}
              {protocol.repetitions && (
                <Badge variant="secondary" className="text-xs">
                  {protocol.repetitions} reps
                </Badge>
              )}
              {protocol.intensity_value && (
                <Badge variant="outline" className="text-xs">
                  {protocol.intensity_value}{protocol.intensity_type === 'percentage' ? '%' : '/10'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProtocolLibrary() {
  const [search, setSearch] = useState("");
  const { protocols } = useProtocols();
  const isLoading = protocols.isLoading;

  const filteredProtocols = protocols.data?.filter(protocol =>
    protocol.name.toLowerCase().includes(search.toLowerCase()) ||
    protocol.description?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Sök protokoll..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {filteredProtocols.map((protocol) => (
            <ProtocolItem key={protocol.id} protocol={protocol} />
          ))}
        </div>

        {filteredProtocols.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm">
              {search ? "Inga protokoll hittades" : "Inga protokoll tillgängliga"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}