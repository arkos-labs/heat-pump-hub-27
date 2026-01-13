import { Client } from '@/types/client';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Calendar, Wrench, CheckCircle } from 'lucide-react';

interface DashboardStatsProps {
  clients: Client[];
}

export function DashboardStats({ clients }: DashboardStatsProps) {
  const stats = [
    {
      label: 'Total clients',
      value: clients.length,
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      label: 'RDV planifiés',
      value: clients.filter((c) => c.status === 'rdv_planifie').length,
      icon: Calendar,
      color: 'text-accent',
      bg: 'bg-accent/10',
    },
    {
      label: 'En cours',
      value: clients.filter((c) => c.status === 'en_cours').length,
      icon: Wrench,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
    {
      label: 'Terminés',
      value: clients.filter((c) => c.status === 'termine').length,
      icon: CheckCircle,
      color: 'text-success',
      bg: 'bg-success/10',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat) => (
        <Card key={stat.label}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${stat.bg}`}>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
