import { Client } from '@/types/client';
import { StatusBadge } from './StatusBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Phone, MapPin, Calendar, Home } from 'lucide-react';

interface ClientCardProps {
  client: Client;
  onClick: () => void;
  isSelected?: boolean;
}

export function ClientCard({ client, onClick, isSelected }: ClientCardProps) {
  const nextRdv = client.rdvs.find(
    (rdv) => new Date(rdv.date) >= new Date()
  );

  return (
    <Card
      onClick={onClick}
      className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary shadow-md' : ''
        }`}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-foreground">
              {client.prenom} {client.nom}
            </h3>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="h-3.5 w-3.5" />
              <span>{client.ville}</span>
            </div>
          </div>
          <StatusBadge status={client.status} />
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="h-3.5 w-3.5" />
            <span>{client.telephone}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Home className="h-3.5 w-3.5" />
            <span>
              {client.typeLogement === 'maison' ? 'Maison' : 'Appartement'}
              {client.surface > 0 && ` • ${client.surface} m²`}
            </span>
          </div>
          {nextRdv && (
            <div className="flex items-center gap-2 text-primary font-medium">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                RDV le {new Date(nextRdv.date).toLocaleDateString('fr-FR')} à{' '}
                {nextRdv.time}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
