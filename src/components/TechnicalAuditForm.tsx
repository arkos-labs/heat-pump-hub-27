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
                                value={formData.visite?.surfaceChauffee || ''}
                                onChange={(e) => updateVisite('surfaceChauffee', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Température ambiante souhaitée (°C)</Label>
                            <Input
                                value={formData.visite?.temperatureSouhaitee || ''}
                                onChange={(e) => updateVisite('temperatureSouhaitee', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>HSP (Hauteur Sous Plafond) en m</Label>
                            <Input
                                value={formData.liaison?.hauteurSousPlafond || ''}
                                onChange={(e) => updateLiaison('hauteurSousPlafond', e.target.value)}
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
                            <Label>Type d'alimentation & Puissance</Label>
                            <div className="grid grid-cols-2 gap-2">
                                <Select
                                    value={formData.elec?.alimentation}
                                    onValueChange={(val: any) => updateElec('alimentation', val)}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="monophase">Monophasé (Max 9kVA)</SelectItem>
                                        <SelectItem value="triphase">Triphasé (Max 18kVA)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input
                                    placeholder="kVA (ex: 9)"
                                    value={formData.visite?.kva}
                                    onChange={(e) => updateVisite('kva', e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Support Groupe Extérieur</Label>
                            <Input
                                placeholder="Dalle, Buffer, Equerres..."
                                value={formData.groupeExterieur?.typeSupport || ''}
                                onChange={(e) => setFormData(p => ({ ...p, groupeExterieur: { typeSupport: (e.target.value as any) } }))}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Emplacement PAC Extérieur</Label>
                            <Input
                                placeholder="Jardin, Pignon Nord, Terrasse..."
                                value={formData.visite?.emplacementPacExterieur || ''}
                                onChange={(e) => updateVisite('emplacementPacExterieur', e.target.value)}
                            />
                        </div>



                        {/* NOUVEAU: Détails Emplacement Intérieur */}
                        <div className="space-y-2 md:col-span-2 border p-2 rounded bg-muted/20">
                            <Label className="text-xs font-semibold">Emplacement & Volumes (Intérieur)</Label>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label className="text-xs">Lieu Prévu</Label>
                                    <Input
                                        placeholder="Ex: Garage, Cellier..."
                                        value={formData.visite?.emplacementInterieur}
                                        onChange={(e) => updateVisite('emplacementInterieur', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Type de Mur</Label>
                                    <Input
                                        placeholder="Porteur, Cloison, Pierre..."
                                        value={formData.visite?.typeMur || ''}
                                        onChange={(e) => updateVisite('typeMur', e.target.value)}
                                        className="h-9"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs">Espace Sol (Largeur cm)</Label>
                                    <Input
                                        placeholder="Min 60cm"
                                        value={formData.visite?.largeurDisponible || ''}
                                        onChange={(e) => updateVisite('largeurDisponible', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label className="font-semibold text-primary">Contraintes Distances & Accès</Label>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs">Dist. PAC-Ballon (Max 1m)</Label>
                                    <Input
                                        placeholder="Mètres"
                                        value={formData.ballons?.distancePacBallon || ''}
                                        onChange={(e) => updateBallons('distancePacBallon', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Dist. Capteurs-Ballon (Max 18m)</Label>
                                    <Input
                                        placeholder="Mètres"
                                        value={formData.ballons?.distanceCapteurBallon || ''}
                                        onChange={(e) => updateBallons('distanceCapteurBallon', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">H. Sous Plafond (Min 2.20m)</Label>
                                    <Input
                                        placeholder="Mètres"
                                        value={formData.liaison?.hauteurSousPlafond || ''}
                                        onChange={(e) => updateLiaison('hauteurSousPlafond', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2 md:col-span-2 border p-2 rounded bg-muted/20">
                            <Label className="text-xs font-semibold">Passage Matériel (Portes & Escaliers)</Label>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <Label className="text-xs">Largeur Porte (+65cm)</Label>
                                    <Input
                                        value={formData.liaison?.largeurPorte || ''}
                                        onChange={(e) => updateLiaison('largeurPorte', e.target.value)}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Label className="text-xs">Type Escalier</Label>
                                    <Input
                                        placeholder="Droit, Colimaçon, L, Tournant..."
                                        value={formData.liaison?.typeEscalier || ''}
                                        onChange={(e) => updateLiaison('typeEscalier', e.target.value)}
                                        className="h-9"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* SECTION 4: Toiture & Solaire */}
            <Card>
                <CardHeader>
                    <CardTitle>4. Toiture & Solaire (SSC / CESI)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Type de Système Solaire</Label>
                            <Input
                                placeholder="CESI, SSC, Photovoltaïque..."
                                value={formData.ballons?.type || ''}
                                onChange={(e) => updateBallons('type', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Type de Toiture</Label>
                            <Input
                                placeholder="Tuiles, Ardoises, Zinc..."
                                value={formData.elec?.typeCouverture || ''}
                                onChange={(e) => updateElec('typeCouverture', e.target.value)}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* SECTION 5: Commentaires */}
            <Card>
                <CardHeader>
                    <CardTitle>5. Commentaires & Observations</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <Label>Notes libres / Infos supplémentaires</Label>
                        <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="RAS, chien méchant, clé sous le pot..."
                            value={formData.visite?.commentaire || ''}
                            onChange={(e) => updateVisite('commentaire', e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* SECTION VALIDATION CONTRATINTES */}
            <Card className="border-orange-200 bg-orange-50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-orange-800">
                        🔍 Vérification Contraintes Chantier
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1">
                    {(() => {
                        const logs = [];
                        const l = formData.liaison;
                        const b = formData.ballons;
                        const sup = formData.groupeExterieur?.typeSupport;

                        // 1. Passage
                        if (l?.largeurPorte && l.largeurPorte < 65) logs.push(`⚠️ Porte étroite (${l.largeurPorte}cm). Min 60cm PAC / 65cm Ballon.`);
                        else if (l?.largeurPorte) logs.push(`✅ Passage Porte OK (>65cm)`);

                        if (l?.typeEscalier === 'colimacon') logs.push(`❌ Escalier Colimaçon : Passage ballon 200L/PAC impossible ou très difficile.`);
                        if (l?.typeEscalier === 'L') logs.push(`⚠️ Escalier en L : Vérifier largeur virage pour ballon 1.84m.`);

                        // 2. Hauteur
                        if (l?.hauteurSousPlafond && l.hauteurSousPlafond < 2.15) logs.push(`❌ Hauteur Plafond (${l.hauteurSousPlafond}m) : Risque pour Ballon Thermodyn (1.84m + 30cm requis).`);

                        // 3. Distances
                        if (b?.distancePacBallon && b.distancePacBallon > 1) logs.push(`⚠️ Distance PAC-Ballon (${b.distancePacBallon}m) > 1m. Déperdition thermique.`);
                        if (b?.distanceCapteurBallon && b.distanceCapteurBallon > 18) logs.push(`⚠️ Liaison Solaire (${b.distanceCapteurBallon}m) > 18m. Risque performance.`);

                        // 4. Support
                        if (!sup || sup === 'autre') logs.push(`⚠️ Support Extérieur non défini. Prévoir Dalle, Big Foot ou Équerres.`);

                        if (logs.length === 0) return <p className="text-sm text-muted-foreground italic">Remplissez les dimensions pour vérifier...</p>;

                        return logs.map((log, i) => (
                            <div key={i} className={`text-sm ${log.includes('✅') ? 'text-green-700' : log.includes('❌') ? 'text-red-700 font-bold' : 'text-orange-700'}`}>
                                {log}
                            </div>
                        ));
                    })()}
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
                        const rawSurf = formData.visite?.surfaceChauffee;
                        const s = typeof rawSurf === 'string' ? parseFloat(rawSurf) : (rawSurf || 0);

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
        </div >
    );
}
