import { useEffect, useState } from 'react';
import { Client, ClientStatus } from '@/types/client';
import { supabase } from '@/lib/supabaseClient'; // Make sure this is imported
import { ClientCard } from '@/components/ClientCard';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ClientsToContact() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadClients = async () => {
            try {
                // Fetch from Supabase "clients" table
                // This table is populated by the Qhare Webhook
                const { data, error: dbError } = await supabase
                    .from('clients')
                    .select('*')
                    .order('created_at', { ascending: false });

                if (dbError) throw dbError;

                if (data) {
                    // Map DB rows to Client interface
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
                        typeLogement: 'maison', // Default
                        surface: 100, // Default for now
                        typeChauffageActuel: 'inconnu',
                        rdvs: [],
                        createdAt: row.created_at
                    }));
                    setClients(mappedClients);
                }
            } catch (err) {
                console.error("Erreur chargement Supabase:", err);
                setError("Impossible de charger les clients.");
            } finally {
                setLoading(false);
            }
        };
        loadClients();
    }, []);

    if (loading) {
        return (
            <div className="container py-6 flex justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Chargement des clients...</span>
            </div>
        );
    }

    return (
        <div className="container py-6">
            <h1 className="text-2xl font-bold mb-4">Clients à contacter (Depuis Qhare/Supabase)</h1>

            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="space-y-4">
                {/* Only show alert if empty? or always show info? */}
                {clients.length === 0 && (
                    <div className="bg-card p-6 rounded-lg border border-border text-center text-muted-foreground">
                        <p>Aucun client trouvé.</p>
                        <p className="text-sm mt-2 opacity-70">
                            Les clients apparaîtront ici automatiquement dès qu'ils seront modifiés/créés dans Qhare.
                        </p>
                    </div>
                )}

                <div className="grid gap-4">
                    {clients.map(client => (
                        <ClientCard
                            key={client.id}
                            client={client}
                            onClick={() => { }}
                            isSelected={false}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
