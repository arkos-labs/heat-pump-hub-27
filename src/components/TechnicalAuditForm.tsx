import { useState } from 'react';
import { Client } from '@/types/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save } from 'lucide-react';
import { Toaster } from 'sonner';
import { toast } from 'sonner';

interface TechnicalAuditFormProps {
    client: Client;
    onSave: (data: NonNullable<Client['technicalData']>) => void;
}

export function TechnicalAuditForm({ client, onSave }: TechnicalAuditFormProps) {
    const [formData, setFormData] = useState<NonNullable<Client['technicalData']>>({
        liaison: {
            distance: 0,
            hauteurSousPlafond: 0,
            largeurPorte: 0,
            typeEscalier: 'droit',
            ...client.technicalData?.liaison
        },
        groupeExterieur: {
            typeSupport: 'dalle_beton',
            ...client.technicalData?.groupeExterieur
        },
        ballons: {
            type: 'electrique',
            distanceCapteurBallon: 0,
            distancePacBallon: 0,
            hauteurPlafondRequis: 0,
            ...client.technicalData?.ballons
        },
        elec: {
            alimentation: 'monophase',
            typeCouverture: '',
            ...client.technicalData?.elec
        },
        audit: {
            videoTableauElectrique: false,
            videoChaudiere: false,
            ...client.technicalData?.audit
        }
    });

    const handleSubmit = () => {
        onSave(formData);
        toast.success("Données techniques sauvegardées");
    };

    const updateLiaison = (field: keyof typeof formData.liaison, value: any) => {
        setFormData(prev => ({ ...prev, liaison: { ...prev.liaison, [field]: value } }));
    };

    const updateGroupe = (field: keyof typeof formData.groupeExterieur, value: any) => {
        setFormData(prev => ({ ...prev, groupeExterieur: { ...prev.groupeExterieur, [field]: value } }));
    };

    const updateBallons = (field: keyof typeof formData.ballons, value: any) => {
        setFormData(prev => ({ ...prev, ballons: { ...prev.ballons, [field]: value } }));
    };

    const updateElec = (field: keyof typeof formData.elec, value: any) => {
        setFormData(prev => ({ ...prev, elec: { ...prev.elec, [field]: value } }));
    };

    const updateAudit = (field: keyof typeof formData.audit, value: any) => {
        setFormData(prev => ({ ...prev, audit: { ...prev.audit, [field]: value } }));
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>1. Liaison et Unité Intérieure (PAC)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Distance de liaison (max 10m)</Label>
                            <Input
                                type="number"
                                value={formData.liaison.distance}
                                onChange={(e) => updateLiaison('distance', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Hauteur sous plafond (m)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.liaison.hauteurSousPlafond}
                                onChange={(e) => updateLiaison('hauteurSousPlafond', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Largeur de porte (cm, min 65)</Label>
                            <Input
                                type="number"
                                value={formData.liaison.largeurPorte}
                                onChange={(e) => updateLiaison('largeurPorte', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Type d'escalier</Label>
                            <Select
                                value={formData.liaison.typeEscalier}
                                onValueChange={(val: any) => updateLiaison('typeEscalier', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="droit">Droit</SelectItem>
                                    <SelectItem value="L">En L</SelectItem>
                                    <SelectItem value="colimacon">Colimaçon (Interdit)</SelectItem>
                                    <SelectItem value="autre">Autre</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>2. Groupe Extérieur</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label>Type de support</Label>
                        <Select
                            value={formData.groupeExterieur.typeSupport}
                            onValueChange={(val: any) => updateGroupe('typeSupport', val)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="dalle_beton">Dalle Béton (Prioritaire)</SelectItem>
                                <SelectItem value="equerres">Équerres Murales</SelectItem>
                                <SelectItem value="big_foot">Big Foot (Sol)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>3. Ballons (Solaire / Électrique)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Type de ballon</Label>
                        <Select
                            value={formData.ballons.type}
                            onValueChange={(val: any) => updateBallons('type', val)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="solaire">Solaire</SelectItem>
                                <SelectItem value="electrique">Électrique</SelectItem>
                                <SelectItem value="thermodynamique">Thermodynamique</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Distance Capteur - Ballon (m)</Label>
                            <Input
                                type="number"
                                value={formData.ballons.distanceCapteurBallon || 0}
                                onChange={(e) => updateBallons('distanceCapteurBallon', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Distance PAC - Ballon (m)</Label>
                            <Input
                                type="number"
                                value={formData.ballons.distancePacBallon || 0}
                                onChange={(e) => updateBallons('distancePacBallon', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Hauteur plafond requise (m)</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.ballons.hauteurPlafondRequis || 0}
                                onChange={(e) => updateBallons('hauteurPlafondRequis', Number(e.target.value))}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>4. Électricité & Toiture</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Alimentation</Label>
                            <Select
                                value={formData.elec.alimentation}
                                onValueChange={(val: any) => updateElec('alimentation', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monophase">Monophasé (Max 9kW)</SelectItem>
                                    <SelectItem value="triphase">Triphasé (Min 18kW)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Type de couverture toiture</Label>
                            <Input
                                placeholder="Tuiles, Ardoises..."
                                value={formData.elec.typeCouverture}
                                onChange={(e) => updateElec('typeCouverture', e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>5. Audit (Vidéos)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="video_tableau"
                            checked={formData.audit.videoTableauElectrique}
                            onCheckedChange={(checked) => updateAudit('videoTableauElectrique', checked)}
                        />
                        <Label htmlFor="video_tableau">Vidéo complète du tableau électrique récupérée</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="video_chaudiere"
                            checked={formData.audit.videoChaudiere}
                            onCheckedChange={(checked) => updateAudit('videoChaudiere', checked)}
                        />
                        <Label htmlFor="video_chaudiere">Vidéo chaudière et murs adjacents récupérée</Label>
                    </div>
                </CardContent>
            </Card>

            <Button onClick={handleSubmit} className="w-full">
                <Save className="mr-2 h-4 w-4" />
                Enregistrer les modifications
            </Button>
        </div>
    );
}
