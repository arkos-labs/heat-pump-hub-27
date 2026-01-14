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
import { Badge } from '@/components/ui/badge';

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
        },
        visite: {
            typeIsolation: '',
            typeRadiateurs: '',
            surfaceChauffee: client.surface || 0,
            temperatureSouhaitee: 20,
            emplacementChaudiere: '',
            emplacementPacExterieur: '',
            distancePacIntExt: 0,
            kva: '',
            isolationCombles: '',
            isolationPlancherBas: '',
            imprimante: false,
            ...client.technicalData?.visite
        }
    });

    const handleSubmit = () => {
        onSave(formData);
        toast.success("Données de visite sauvegardées");
    };

    const updateVisite = (field: keyof NonNullable<NonNullable<Client['technicalData']>['visite']>, value: any) => {
        setFormData(prev => ({
            ...prev,
            visite: { ...prev.visite, [field]: value }
        }));
    };

    // Helpers existants (simplifiés pour l'exemple, à garder si besoin)
    const updateElec = (field: any, value: any) => setFormData(p => ({ ...p, elec: { ...p.elec, [field]: value } }));
    const updateLiaison = (field: any, value: any) => setFormData(p => ({ ...p, liaison: { ...p.liaison, [field]: value } }));
    const updateBallons = (field: any, value: any) => setFormData(p => ({ ...p, ballons: { ...p.ballons, [field]: value } }));
    const updateAudit = (field: any, value: any) => setFormData(p => ({ ...p, audit: { ...p.audit, [field]: value } }));


    return (
        <div className="space-y-6">
            {/* SECTION 1: Chauffage & Client */}
            <Card>
                <CardHeader>
                    <CardTitle>1. État des lieux Chauffage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Surface Chauffée (m²)</Label>
                            <Input
                                type="number"
                                value={formData.visite?.surfaceChauffee}
                                onChange={(e) => updateVisite('surfaceChauffee', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Température ambiante souhaitée (°C)</Label>
                            <Input
                                type="number"
                                value={formData.visite?.temperatureSouhaitee}
                                onChange={(e) => updateVisite('temperatureSouhaitee', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>HSP (Hauteur Sous Plafond) en m</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={formData.liaison?.hauteurSousPlafond}
                                onChange={(e) => updateLiaison('hauteurSousPlafond', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Type de radiateurs</Label>
                            <Input
                                placeholder="Fonte, Acier, Alu..."
                                value={formData.visite?.typeRadiateurs}
                                onChange={(e) => updateVisite('typeRadiateurs', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>Où est située l'actuelle Chaudière ?</Label>
                            <Input
                                placeholder="Cave, Garage, Cuisine..."
                                value={formData.visite?.emplacementChaudiere}
                                onChange={(e) => updateVisite('emplacementChaudiere', e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* SECTION 2: Isolation */}
            <Card>
                <CardHeader>
                    <CardTitle>2. Isolation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Type d'isolation générale</Label>
                        <Input
                            placeholder="Interne, Externe, Année..."
                            value={formData.visite?.typeIsolation}
                            onChange={(e) => updateVisite('typeIsolation', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Isolation des combles (Ventilé ? Type ?)</Label>
                        <Input
                            placeholder="Laine de verre, Soufflé..."
                            value={formData.visite?.isolationCombles}
                            onChange={(e) => updateVisite('isolationCombles', e.target.value)}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Isolation Plancher Bas (Type ?)</Label>
                        <Input
                            value={formData.visite?.isolationPlancherBas}
                            onChange={(e) => updateVisite('isolationPlancherBas', e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* SECTION 3: Électricité & Implantation */}
            <Card>
                <CardHeader>
                    <CardTitle>3. Électricité & Implantation PAC</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Monophasé ou Triphasé ?</Label>
                            <Select
                                value={formData.elec?.alimentation}
                                onValueChange={(val: any) => updateElec('alimentation', val)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="monophase">Monophasé</SelectItem>
                                    <SelectItem value="triphase">Triphasé</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Puissance compteur (kVA) ?</Label>
                            <Input
                                placeholder="6, 9, 12..."
                                value={formData.visite?.kva}
                                onChange={(e) => updateVisite('kva', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label>Emplacement Pose PAC Extérieur</Label>
                            <div className="mb-2">
                                <Input
                                    placeholder="Détails (Betonné ? Mur ? Distance ?)..."
                                    value={formData.visite?.emplacementPacExterieur}
                                    onChange={(e) => updateVisite('emplacementPacExterieur', e.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs">Distance Int/Ext (m)</Label>
                                    <Input
                                        type="number"
                                        value={formData.liaison?.distance}
                                        onChange={(e) => updateLiaison('distance', Number(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Largeur Escalier (cm)</Label>
                                    <Input
                                        type="number"
                                        placeholder="Si escalier..."
                                        value={formData.liaison?.largeurEscalier}
                                        onChange={(e) => updateLiaison('largeurEscalier', Number(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Si SSC : Type de toiture & Ballon</Label>
                            <Input
                                placeholder="Tuiles, Ardoise..."
                                value={formData.elec?.typeCouverture}
                                onChange={(e) => updateElec('typeCouverture', e.target.value)}
                            />
                            <div className="mt-2">
                                <Label className="text-xs">Distance entre ballons (si plusieurs)</Label>
                                <Input
                                    type="number"
                                    value={formData.ballons?.distanceEntreBallons}
                                    onChange={(e) => updateBallons('distanceEntreBallons', Number(e.target.value))}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-4 border-t">
                        <Checkbox
                            id="imprimante"
                            checked={formData.visite?.imprimante}
                            onCheckedChange={(checked) => updateVisite('imprimante', checked)}
                        />
                        <Label htmlFor="imprimante">Le client a-t-il une imprimante ? (Pour doc à signer)</Label>
                    </div>
                </CardContent>
            </Card>

            {/* SECTION 4: Préconisation (Calcul Automatique) */}
            <Card className="border-primary/50 bg-primary/5">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                        🎯 Solutions Préconisées (Règle Mètres Carrés)
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {(() => {
                        const s = formData.visite?.surfaceChauffee || 0;

                        let modele = "";
                        let puissanceDetails = "";

                        // Règles spécifiques fournies
                        if (s < 80) {
                            modele = "PAC 6-8 kW (Surface < 80m²)";
                            puissanceDetails = "Petite surface, vérifier isolation.";
                        }
                        else if (s >= 80 && s < 100) {
                            modele = "PAC 10 kW";
                            puissanceDetails = "Pour maison 80-100m² (bien isolée).";
                        }
                        else if (s >= 100 && s < 120) {
                            modele = "PAC 12 kW";
                            puissanceDetails = "Pour maison 100-120m².";
                        }
                        else if (s >= 120 && s < 140) {
                            modele = "PAC 14 kW";
                            puissanceDetails = "Pour maison 120-140m².";
                        }
                        else if (s >= 140 && s <= 170) {
                            modele = "PAC 16 kW";
                            puissanceDetails = "Pour maison 140-170m².";
                        }
                        else {
                            modele = "PAC > 16 kW (Étude sur mesure requise)";
                            puissanceDetails = "Grandes surfaces > 170m².";
                        }

                        const alim = formData.elec?.alimentation === 'monophase' ? 'Compteur Monophasé' : 'Compteur Triphasé';
                        const noteElec = "⚠️ Vérifier compatibilité compteur (La PAC existe en Mono & Tri)";

                        if (s === 0) return <p className="text-sm text-muted-foreground">Renseignez la surface pour voir la préconisation.</p>;

                        return (
                            <div className="space-y-3">
                                <div className="flex justify-between items-center bg-background p-3 rounded-lg border">
                                    <span className="font-medium">Surface Renseignée :</span>
                                    <span className="text-xl font-bold">{s} m²</span>
                                </div>
                                <div className="bg-background p-4 rounded-lg border border-primary/20">
                                    <p className="text-sm text-muted-foreground mb-1">Modèle suggéré :</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-2xl font-bold text-primary">{modele}</p>
                                    </div>
                                    <p className="text-sm italic text-muted-foreground mt-1">{puissanceDetails}</p>

                                    <div className="flex flex-col gap-1 mt-3 pt-3 border-t">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Installation électrique :</span>
                                            <Badge variant="outline" className="bg-primary/10">
                                                {alim}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                                            {noteElec}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </CardContent>
            </Card>

            <Button onClick={handleSubmit} className="w-full bg-blue-600 hover:bg-blue-700">
                <Save className="mr-2 h-4 w-4" />
                Valider la Visite Technique
            </Button>
        </div>
    );
}
