import { useEffect, useState } from 'react';
import { Client } from '@/types/client';
import { qhareService } from '@/services/qhare';
import { ClientCard } from '@/components/ClientCard';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ClientsToContact() {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [usingFallback, setUsingFallback] = useState(false);

    useEffect(() => {
        const loadClients = async () => {
            try {
                const data = await qhareService.getSignedClients();
                setClients(data);
                // Simple heuristic: if IDs start with 'demo-', we are using fallback
                if (data.length > 0 && data[0].id.startsWith('demo-')) {
                    setUsingFallback(true);
                }
            } catch (err) {
                setError("Impossible de charger les clients depuis Qhare.");
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
            </div>
        );
    }

    return (
        <div className="container py-6">
            <h1 className="text-2xl font-bold mb-4">Clients à contacter (Signés)</h1>

            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Erreur</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {usingFallback && (
                <Alert variant="default" className="mb-6 border-yellow-500 bg-yellow-50">
                    <AlertCircle className="h-4 w-4 text-yellow-600" />
                    <AlertTitle className="text-yellow-800">Mode Démonstration (API Lecture non détectée)</AlertTitle>
                    <AlertDescription className="text-yellow-700">
                        D'après la documentation fournie, votre clé API ne permet que d'<strong>importer</strong> ou <strong>modifier</strong> des clients (Écriture), mais pas de les <strong>lire</strong> (Lecture).
                        <br /><br />
                        En attendant d'obtenir une clé ou une URL pour "Lister/Exporter" les leads depuis le support Qhare, voici des données de démonstration.
                    </AlertDescription>
                </Alert>
            )}

            <div className="space-y-4">
                {clients.length === 0 ? (
                    <div className="bg-card p-6 rounded-lg border border-border text-center text-muted-foreground">
                        <p>Aucun client marqué comme "signé" trouvé sur Qhare pour le moment.</p>
                        <p className="text-sm mt-2 opacity-70">(Vérifiez que l'API Qhare est accessible)</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {clients.map(client => (
                            <ClientCard
                                key={client.id}
                                client={client}
                                onClick={() => { }} // TODO: Navigate to detail or open modal
                                isSelected={false}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
