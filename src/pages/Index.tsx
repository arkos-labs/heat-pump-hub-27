import { useState } from 'react';
import { Client, ClientStatus, Appointment } from '@/types/client';
import { mockClients } from '@/data/mockClients';
import { ClientCard } from '@/components/ClientCard';
import { ClientDetail } from '@/components/ClientDetail';

import { AddRdvDialog } from '@/components/AddRdvDialog';
import { DashboardStats } from '@/components/DashboardStats';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { statusLabels } from '@/types/client';
import { Search } from 'lucide-react';

const Index = () => {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [showAddRdv, setShowAddRdv] = useState(false);

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      `${client.prenom} ${client.nom} ${client.ville}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (status: ClientStatus) => {
    if (!selectedClient) return;
    const updatedClients = clients.map((c) =>
      c.id === selectedClient.id ? { ...c, status } : c
    );
    setClients(updatedClients);
    setSelectedClient({ ...selectedClient, status });
  };



  const handleAddRdv = (rdvData: Omit<Appointment, 'id'>) => {
    if (!selectedClient) return;
    const newRdv: Appointment = {
      ...rdvData,
      id: Date.now().toString(),
    };
    const updatedClient = {
      ...selectedClient,
      rdvs: [...selectedClient.rdvs, newRdv],
      status: 'rdv_planifie' as ClientStatus,
    };
    const updatedClients = clients.map((c) =>
      c.id === selectedClient.id ? updatedClient : c
    );
    setClients(updatedClients);
    setSelectedClient(updatedClient);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
                <p className="text-sm text-muted-foreground">
                  Vue d'ensemble des activités
                </p>
              </div>
            </div>

          </div>
        </div>
      </header>

      <main className="container py-6">
        {/* Stats */}
        <DashboardStats clients={clients} />

        {/* Filtres */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.entries(statusLabels).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Contenu principal */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Liste des clients */}
          <div className="space-y-3">
            <h2 className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">
              Clients ({filteredClients.length})
            </h2>
            {filteredClients.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>Aucun client trouvé</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredClients.map((client) => (
                  <ClientCard
                    key={client.id}
                    client={client}
                    onClick={() => setSelectedClient(client)}
                    isSelected={selectedClient?.id === client.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Détail client */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            {selectedClient ? (
              <ClientDetail
                client={selectedClient}
                onStatusChange={handleStatusChange}
                onAddRdv={() => setShowAddRdv(true)}
                onUpdateClient={(updatedClient) => {
                  setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
                  setSelectedClient(updatedClient);
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-[400px] border-2 border-dashed rounded-lg text-muted-foreground">
                <p>Sélectionnez un client pour voir les détails</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Dialogs */}
      {selectedClient && (
        <AddRdvDialog
          open={showAddRdv}
          onOpenChange={setShowAddRdv}
          onAdd={handleAddRdv}
          clientName={`${selectedClient.prenom} ${selectedClient.nom}`}
        />
      )}
    </div>
  );
};

export default Index;
