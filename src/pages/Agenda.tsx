import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Appointment } from "@/types/client";
import { Calendar as CalendarIcon, Clock, MapPin, User } from "lucide-react";

// Mock appointments for demonstration
const MOCK_APPOINTMENTS: (Appointment & { clientName: string })[] = [
    {
        id: "rdv-1",
        date: new Date().toISOString(), // Today
        time: "14:00",
        type: "installation",
        status: "planifie",
        notes: "Vérifier l'emplacement du groupe extérieur",
        clientName: "Jean Dupont"
    },
    {
        id: "rdv-2",
        date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        time: "09:00",
        type: "installation",
        status: "planifie",
        notes: "Installation complète PAC Air/Eau",
        clientName: "Sophie Martin"
    }
];

export default function Agenda() {
    const [date, setDate] = useState<Date | undefined>(new Date());

    // Filter appointments for selected date
    const selectedDateAppointments = MOCK_APPOINTMENTS.filter(app => {
        if (!date) return false;
        const appDate = new Date(app.date);
        return (
            appDate.getDate() === date.getDate() &&
            appDate.getMonth() === date.getMonth() &&
            appDate.getFullYear() === date.getFullYear()
        );
    });

    return (
        <div className="container py-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight">Agenda</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Calendar View */}
                <div className="md:col-span-4 lg:col-span-3">
                    <Card>
                        <CardContent className="p-0">
                            <Calendar
                                mode="single"
                                selected={date}
                                onSelect={setDate}
                                className="rounded-md border shadow-none w-full flex justify-center"
                                locale={fr}
                            />
                        </CardContent>
                    </Card>
                </div>

                {/* Appointments List */}
                <div className="md:col-span-8 lg:col-span-9 space-y-4">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-primary" />
                        {date ? format(date, "EEEE d MMMM yyyy", { locale: fr }) : "Sélectionnez une date"}
                    </h2>

                    {selectedDateAppointments.length === 0 ? (
                        <Card className="bg-muted/50 border-dashed">
                            <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                                <CalendarIcon className="h-12 w-12 mb-4 opacity-20" />
                                <p>Aucun rendez-vous prévu pour cette date.</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-4">
                            {selectedDateAppointments.map((rdv) => (
                                <Card key={rdv.id} className="overflow-hidden border-l-4 border-l-primary">
                                    <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="capitalize">
                                                    {rdv.type.replace('_', ' ')}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {format(new Date(rdv.date), "HH:mm")}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                                {rdv.clientName}
                                            </h3>
                                            <div className="text-sm text-muted-foreground flex items-center gap-4">
                                                {rdv.notes && (
                                                    <span className="flex items-center gap-1">
                                                        📝 {rdv.notes}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex gap-2 w-full sm:w-auto">
                                            <Badge className={
                                                rdv.status === 'termine' ? 'bg-green-500' :
                                                    rdv.status === 'annule' ? 'bg-red-500' : 'bg-blue-500'
                                            }>
                                                {rdv.status}
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
