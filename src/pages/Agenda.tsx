import { useState, useEffect } from "react";
import { format, isSameDay, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Appointment } from "@/types/client";
import { Calendar as CalendarIcon, Clock, MapPin, User, ChevronRight, Phone } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Client, ClientStatus } from "@/types/client";
import { ClientDetail } from "@/components/ClientDetail";
import { clientService } from "@/services/clientService";
import { toast } from "sonner";

// Extended appointment type to include client info for display
type AgendaAppointment = Appointment & {
    clientId: string;
    clientName: string;
    clientAddress: string;
    clientPhone: string;
    clientCity: string;
};

// Helper to map DB client to App Client
const mapDbClientToApp = (row: any): Client => {
    const appointments = row.appointments || [];
    return {
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
        rdvs: appointments,
        createdAt: row.created_at,
        technicalData: row.technical_data,
        notes: row.notes,
        puissanceEstimee: row.puissance_estimee // Ensure this is mapped if it exists
    };
};

export default function Agenda() {
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [appointments, setAppointments] = useState<AgendaAppointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // const navigate = useNavigate(); // No longer needed for navigation if we stay on page
    const [selectedDetailClient, setSelectedDetailClient] = useState<Client | null>(null);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const { data: clients, error } = await supabase
                    .from('clients')
                    .select('id, nom, prenom, adresse, ville, telephone, appointments'); // appointments is the jsonb column based on previous context (or 'rdvs' if mapped? In DB it's mostly 'appointments' or inside technicalData? No, previous files showed 'appointments' column being used/created). 
                // Let's check: previous edit in clientService used 'appointments'.

                if (error) throw error;

                if (clients) {
                    const allAppointments: AgendaAppointment[] = [];
                    clients.forEach((client: any) => {
                        const clientAppts: Appointment[] = client.appointments || [];
                        // Or checks 'rdvs' if mapped differently, but usually stored as raw json in 'appointments'

                        clientAppts.forEach(appt => {
                            allAppointments.push({
                                ...appt,
                                clientId: client.id,
                                clientName: `${client.prenom} ${client.nom}`,
                                clientAddress: client.adresse,
                                clientCity: client.ville,
                                clientPhone: client.telephone
                            });
                        });
                    });
                    setAppointments(allAppointments);
                }
            } catch (error) {
                console.error("Error fetching appointments:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAppointments();
    }, []);

    const handleViewClient = async (clientId: string) => {
        try {
            const { data, error } = await supabase
                .from('clients')
                .select('*')
                .eq('id', clientId)
                .single();

            if (error) throw error;
            if (data) {
                const client = mapDbClientToApp(data);
                setSelectedDetailClient(client);
                // Scroll to bottom smoothly
                setTimeout(() => {
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                }, 100);
            }
        } catch (error) {
            console.error("Error loading client details:", error);
            toast.error("Erreur lors du chargement de la fiche client");
        }
    };

    const handleUpdateClient = async (updatedClient: Client) => {
        try {
            await clientService.updateClient(updatedClient.id, updatedClient);
            setSelectedDetailClient(updatedClient);
            toast.success("Client mis à jour");
            // Refresh appointments list if needed? For now just local update is enough for details.
        } catch (error) {
            console.error(error);
            toast.error("Erreur sauvegarde");
        }
    };

    const handleStatusChange = async (newStatus: ClientStatus) => {
        if (!selectedDetailClient) return;
        const updated = { ...selectedDetailClient, status: newStatus };
        handleUpdateClient(updated);
    };

    // Filter appointments for selected date
    // Helper to safely parse any date string (ISO or FR)
    const safeParseDate = (dateStr: string | Date | undefined): Date | undefined => {
        if (!dateStr) return undefined;
        if (dateStr instanceof Date) return dateStr;

        // Try ISO parse first
        let parsed = parseISO(dateStr);
        if (parsed.toString() !== 'Invalid Date') return parsed;

        // Try FR format parsing (DD/MM/YYYY)
        const match = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
        if (match) {
            const day = parseInt(match[1], 10);
            const month = parseInt(match[2], 10) - 1;
            const year = parseInt(match[3], 10);
            return new Date(year, month, day);
        }
        return undefined;
    };

    // Filter appointments for selected date
    const selectedDateAppointments = appointments.filter(app => {
        if (!date) return false;
        const appDate = safeParseDate(app.date);
        if (!appDate) return false;
        return isSameDay(appDate, date);
    });

    // Identify days with appointments for calendar modifiers
    const daysWithAppointments = appointments
        .map(a => safeParseDate(a.date))
        .filter((d): d is Date => d !== undefined);



    return (
        <div className="container py-8 space-y-8 max-w-7xl mx-auto">
            <div className="flex items-center justify-between border-b pb-6">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-foreground">Agenda</h1>
                    <p className="text-muted-foreground mt-2">Gérez vos rendez-vous et installations.</p>
                </div>
                <Button variant="outline" onClick={() => setDate(new Date())}>
                    Aujourd'hui
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Calendar View */}
                <div className="lg:col-span-4 xl:col-span-3">
                    <Card className="sticky top-6 border-none shadow-md bg-card/50 backdrop-blur-sm">
                        <CardContent className="p-4">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                className="rounded-md w-full flex justify-center p-2"
                                locale={fr}
                                modifiers={{
                                    booked: daysWithAppointments
                                }}
                                modifiersStyles={{
                                    booked: {
                                        fontWeight: 'bold',
                                        backgroundColor: '#10b981', // green-500
                                        color: 'white',
                                        borderRadius: '4px'
                                    }
                                }}
                                classNames={{
                                    day_selected: "bg-blue-600 text-white hover:bg-blue-600 focus:bg-blue-600",
                                    day_today: "bg-accent text-accent-foreground",
                                }}
                            />
                            <div className="mt-4 px-4 py-3 bg-muted/50 rounded-lg text-sm text-muted-foreground flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-primary" />
                                <span>Jour avec rendez-vous</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* UPCOMING APPOINTMENTS LIST */}
                    <Card className="mt-6 border-none shadow-md bg-card/50 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-lg">Prochains Rendez-vous</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y">
                                {appointments
                                    .filter(app => {
                                        const d = safeParseDate(app.date);
                                        return d && d >= new Date(new Date().setHours(0, 0, 0, 0));
                                    })
                                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                    .slice(0, 5)
                                    .map(app => (
                                        <div
                                            key={app.id}
                                            className="p-3 hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
                                            onClick={() => {
                                                const d = safeParseDate(app.date);
                                                if (d) setDate(d);
                                            }}
                                        >
                                            <div className="bg-primary/10 text-primary font-bold text-center px-2 py-1 rounded min-w-[50px]">
                                                <div className="text-xs uppercase">{format(safeParseDate(app.date)!, 'MMM', { locale: fr })}</div>
                                                <div className="text-lg leading-none">{format(safeParseDate(app.date)!, 'dd')}</div>
                                            </div>
                                            <div className="overflow-hidden">
                                                <p className="font-semibold truncate text-sm">{app.clientName}</p>
                                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {app.time} • {app.clientCity}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                {appointments.length === 0 && (
                                    <div className="p-4 text-center text-sm text-muted-foreground">Aucun RDV à venir.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Appointments List */}
                <div className="lg:col-span-8 xl:col-span-9 space-y-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <CalendarIcon className="h-6 w-6" />
                        </div>
                        <h2 className="text-2xl font-semibold capitalize">
                            {date ? format(date, "EEEE d MMMM yyyy", { locale: fr }) : "Sélectionnez une date"}
                        </h2>
                        {selectedDateAppointments.length > 0 && (
                            <Badge variant="secondary" className="ml-2 text-base px-3 py-0.5">
                                {selectedDateAppointments.length}
                            </Badge>
                        )}
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-4" />
                            <p>Chargement des rendez-vous...</p>
                        </div>
                    ) : selectedDateAppointments.length === 0 ? (
                        <Card className="bg-muted/30 border-dashed border-2">
                            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                                <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                                    <CalendarIcon className="h-8 w-8 opacity-40" />
                                </div>
                                <p className="text-lg font-medium">Aucun rendez-vous prévu</p>
                                <p className="text-sm">Sélectionnez une autre date ou ajoutez un RDV depuis la fiche client.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {selectedDateAppointments.map((rdv) => (
                                <Card key={rdv.id} className="group overflow-hidden border-l-4 border-l-primary hover:shadow-lg transition-all duration-300">
                                    <CardContent className="p-0">
                                        <div className="flex flex-col md:flex-row">
                                            {/* Time Column */}
                                            <div className="bg-primary/5 p-6 md:w-48 flex flex-col justify-center items-center md:items-start border-b md:border-b-0 md:border-r border-border/50">
                                                <div className="flex items-center gap-2 text-primary font-bold text-2xl">
                                                    <Clock className="h-5 w-5" />
                                                    {rdv.time}
                                                </div>
                                                <Badge variant="outline" className="mt-2 capitalize bg-background/50 border-primary/20">
                                                    {rdv.type?.replace('_', ' ') || 'Rendez-vous'}
                                                </Badge>
                                            </div>

                                            {/* Info Column */}
                                            <div className="p-6 flex-1 flex flex-col justify-center gap-3">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                    <h3 className="font-bold text-xl flex items-center gap-2 text-foreground group-hover:text-primary transition-colors cursor-pointer" onClick={() => handleViewClient(rdv.clientId)}>
                                                        <User className="h-5 w-5 text-muted-foreground" />
                                                        {rdv.clientName}
                                                    </h3>
                                                    <div className="flex gap-2">
                                                        <Badge className={
                                                            rdv.status === 'termine' ? 'bg-green-500 hover:bg-green-600' :
                                                                rdv.status === 'annule' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'
                                                        }>
                                                            {rdv.status || 'Planifié'}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground mt-2">
                                                    <div className="flex items-start gap-2">
                                                        <MapPin className="h-4 w-4 mt-0.5 text-primary/70" />
                                                        <span>{rdv.clientAddress}, {rdv.clientCity}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Phone className="h-4 w-4 text-primary/70" />
                                                        <span>{rdv.clientPhone}</span>
                                                    </div>
                                                </div>

                                                {rdv.notes && (
                                                    <div className="mt-3 p-3 bg-muted/50 rounded-md text-sm border border-border/50">
                                                        <span className="font-semibold mr-2">Note:</span>
                                                        {rdv.notes}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Column */}
                                            <div className="p-4 md:border-l border-t md:border-t-0 flex md:flex-col justify-center gap-2 bg-muted/10">
                                                <Button size="sm" variant="ghost" className="w-full justify-start md:justify-center" onClick={() => handleViewClient(rdv.clientId)}>
                                                    Fiche client <ChevronRight className="h-4 w-4 ml-1" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Client Detail Section */}
            {
                selectedDetailClient && (
                    <div className="mt-12 border-t pt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">Fiche Client : {selectedDetailClient.prenom} {selectedDetailClient.nom}</h2>
                            <Button variant="outline" onClick={() => setSelectedDetailClient(null)}>Fermer</Button>
                        </div>
                        <div className="bg-card rounded-xl border shadow-sm p-6">
                            <ClientDetail
                                client={selectedDetailClient}
                                onStatusChange={handleStatusChange}
                                onUpdateClient={handleUpdateClient}
                                onAddRdv={() => toast.info("Pour ajouter un RDV, passez par le tableau de bord.")}
                                onSimulateJourJ={() => toast.info("Simulation disponible sur le tableau de bord.")}
                            />
                        </div>
                    </div>
                )
            }
        </div >
    );
}
