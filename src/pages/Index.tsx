import { useState, useEffect } from 'react';
import { Client, ClientStatus, Appointment } from '@/types/client';
import { supabase } from '@/lib/supabaseClient';
import { clientService } from '@/services/clientService';
import { ClientCard } from '@/components/ClientCard';
import { ClientDetail } from '@/components/ClientDetail';

import { AddRdvDialog } from '@/components/AddRdvDialog';
import { DashboardStats } from '@/components/DashboardStats';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { toast } from 'sonner';

const Index = () => {
  const [clients, setClients] = useState<Client[]>([]); // Initialize with empty array
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddRdv, setShowAddRdv] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch clients from Supabase
  useEffect(() => {
    const loadClients = async () => {
      try {
        const { data, error } = await supabase
          .from('clients')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        if (data) {
          const mappedClients: Client[] = data.map((row: any) => ({
            id: row.id.toString(),
            nom: row.nom || 'Inconnu',
            prenom: row.prenom || '',
            email: row.email || '',
            telephone: row.telephone || '',
            adresse: row.adresse || '',
            ville: row.ville || '',
            codePostal: row.code_postal || '',
            status: (row.status as ClientStatus) || 'nouveau',
            typeLogement: row.type_logement || 'maison',
            surface: row.surface || 100,
            typeChauffageActuel: row.type_chauffage_actuel || 'inconnu',
            rdvs: row.appointments || [], // Load appointments from JSON column
            createdAt: row.created_at,
            technicalData: row.technical_data
          }));
          setClients(mappedClients);
        }
      } catch (err) {
        console.error("Erreur chargement Supabase:", err);
        toast.error("Impossible de charger les clients");
      } finally {
        setLoading(false);
      }
    };
    loadClients();
  }, []);

  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      `${client.prenom} ${client.nom} ${client.ville}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = async (status: ClientStatus) => {
    if (!selectedClient) return;

    // Optimistic update
    const updatedClient = { ...selectedClient, status };
    setClients(clients.map(c => c.id === selectedClient.id ? updatedClient : c));
    setSelectedClient(updatedClient);

    try {
      await clientService.updateClient(selectedClient.id, { status });
      toast.success("Statut mis à jour");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la mise à jour du statut");
      // Revert (idealement)
    }
  };

  const handleClientUpdate = async (updatedClientData: Client) => {
    // Optimistic update
    setClients(clients.map(c => c.id === updatedClientData.id ? updatedClientData : c));
    setSelectedClient(updatedClientData);

    try {
      await clientService.updateClient(updatedClientData.id, updatedClientData);
      toast.success("Informations sauvegardées");
    } catch (error) {
      console.error(error);
      toast.error("Erreur sauvegarde");
    }
  }

  const handleAddRdv = async (rdvData: Omit<Appointment, 'id'>) => {
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

    // Optimistic
    setClients(clients.map((c) =>
      c.id === selectedClient.id ? updatedClient : c
    ));
    setSelectedClient(updatedClient);

    try {
      await clientService.addAppointment(selectedClient.id, newRdv);
      toast.success("Rendez-vous planifié");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la planification");
    }
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

        {/* Contenu principal avec Onglets */}
        <div className="grid lg:grid-cols-2 gap-6">
          <Tabs defaultValue="a_traiter" className="w-full lg:col-span-1">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="a_traiter">À traiter</TabsTrigger>
              <TabsTrigger value="en_cours">En cours</TabsTrigger>
              <TabsTrigger value="termines">Terminés</TabsTrigger>
            </TabsList>

            {/* Onglet À Traiter */}
            <TabsContent value="a_traiter" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Nouveaux & Non planifiés
                </h2>
                <Badge variant="secondary">{clients.filter(c => ['nouveau', 'contacte'].includes(c.status)).length}</Badge>
              </div>

              <div className="space-y-3">
                {filteredClients
                  .filter(c => ['nouveau', 'contacte'].includes(c.status))
                  .length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>Aucun client à traiter</p>
                  </div>
                ) : (
                  filteredClients
                    .filter(c => ['nouveau', 'contacte'].includes(c.status))
                    .map((client) => (
                      <ClientCard
                        key={client.id}
                        client={client}
                        onClick={() => setSelectedClient(client)}
                        isSelected={selectedClient?.id === client.id}
                      />
                    ))
                )}
              </div>
            </TabsContent>

            {/* Onglet En Cours */}
            <TabsContent value="en_cours" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Planifiés & En installation
                </h2>
                <Badge variant="secondary">{clients.filter(c => ['rdv_planifie', 'en_cours'].includes(c.status)).length}</Badge>
              </div>

              <div className="space-y-3">
                {filteredClients
                  .filter(c => ['rdv_planifie', 'en_cours'].includes(c.status))
                  .length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>Aucun client en cours</p>
                  </div>
                ) : (
                  filteredClients
                    .filter(c => ['rdv_planifie', 'en_cours'].includes(c.status))
                    .map((client) => (
                      <ClientCard
                        key={client.id}
                        client={client}
                        onClick={() => setSelectedClient(client)}
                        isSelected={selectedClient?.id === client.id}
                      />
                    ))
                )}
              </div>
            </TabsContent>

            {/* Onglet Terminés */}
            <TabsContent value="termines" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Dossiers clôturés
                </h2>
                <Badge variant="secondary">{clients.filter(c => c.status === 'termine').length}</Badge>
              </div>

              <div className="space-y-3">
                {filteredClients
                  .filter(c => c.status === 'termine')
                  .length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <p>Aucun client terminé</p>
                  </div>
                ) : (
                  filteredClients
                    .filter(c => c.status === 'termine')
                    .map((client) => (
                      <ClientCard
                        key={client.id}
                        client={client}
                        onClick={() => setSelectedClient(client)}
                        isSelected={selectedClient?.id === client.id}
                      />
                    ))
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Détail client (Colonne de droite permanente) */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            {selectedClient ? (
              <ClientDetail
                client={selectedClient}
                onStatusChange={handleStatusChange}
                onAddRdv={() => setShowAddRdv(true)}
                onUpdateClient={(updatedClient: Client) => {
                  setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
                  setSelectedClient(updatedClient);
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed rounded-lg text-muted-foreground bg-muted/30">
                <Search className="h-12 w-12 mb-4 opacity-20" />
                <p className="font-medium">Sélectionnez un client</p>
                <p className="text-sm">Cliquez sur un client à gauche pour voir les détails</p>
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
