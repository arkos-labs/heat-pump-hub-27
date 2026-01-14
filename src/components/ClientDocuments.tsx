
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { FileText, Trash2, Upload, FileIcon, Loader2, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ClientDocumentsProps {
    clientId: string;
}

interface FileObject {
    name: string;
    id: string;
    updated_at: string;
    created_at: string;
    last_accessed_at: string;
    metadata: Record<string, any>;
}

export function ClientDocuments({ clientId }: ClientDocumentsProps) {
    const [files, setFiles] = useState<FileObject[]>([]);
    const [uploading, setUploading] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchFiles = async () => {
        try {
            const { data, error } = await supabase.storage
                .from("client_documents")
                .list(clientId + "/");

            if (error) {
                // Ignorer l'erreur si le bucket n'existe pas encore ou est vide
                console.error("Erreur chargement fichiers:", error);
            } else {
                setFiles(data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, [clientId]);

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!event.target.files || event.target.files.length === 0) {
                return;
            }
            setUploading(true);
            const file = event.target.files[0];
            const fileExt = file.name.split(".").pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
            const filePath = `${clientId}/${fileName}`;

            const { error } = await supabase.storage
                .from("client_documents")
                .upload(filePath, file);

            if (error) {
                // Gestion spécifique si le bucket n'existe pas
                if (error.message.includes("Bucket not found")) {
                    toast.error("Le dossier de stockage 'client_documents' n'existe pas. Veuillez le créer dans Supabase.");
                } else {
                    throw error;
                }
            } else {
                toast.success("Fichier téléchargé avec succès");
                fetchFiles();
            }
        } catch (error: any) {
            toast.error("Erreur upload: " + error.message);
        } finally {
            setUploading(false);
            // Reset input
            event.target.value = "";
        }
    };

    const handleDelete = async (fileName: string) => {
        if (!confirm("Voulez-vous vraiment supprimer ce document ?")) return;

        try {
            const { error } = await supabase.storage
                .from("client_documents")
                .remove([`${clientId}/${fileName}`]);

            if (error) throw error;
            toast.success("Document supprimé");
            setFiles(files.filter((x) => x.name !== fileName));
        } catch (error) {
            toast.error("Erreur suppression");
        }
    };

    const getPublicUrl = (fileName: string) => {
        const { data } = supabase.storage
            .from("client_documents")
            .getPublicUrl(`${clientId}/${fileName}`);
        return data.publicUrl;
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader className="border-b pb-3 flex flex-row items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Documents & Photos
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <Button disabled={uploading} variant="outline" className="cursor-pointer relative overflow-hidden">
                            {uploading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" /> Ajouter un document
                                </>
                            )}
                            <input
                                type="file"
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                onChange={handleFileUpload}
                                disabled={uploading}
                            />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="pt-6">
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : files.length === 0 ? (
                        <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/20">
                            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                                <FileIcon className="h-6 w-6 text-muted-foreground" />
                            </div>
                            <p className="font-medium text-muted-foreground">Aucun document</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Photos, Devis, Factures...
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {files.map((file) => (
                                <div
                                    key={file.id}
                                    className="group relative border rounded-lg p-3 hover:shadow-md transition-all bg-card"
                                >
                                    <div className="flex items-start justify-between mb-2">
                                        <div className="p-2 bg-primary/10 rounded-md">
                                            <FileText className="h-6 w-6 text-primary" />
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleDelete(file.name)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="font-medium text-sm truncate" title={file.name}>
                                            {file.name}
                                        </p>
                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                            <span>{(file.metadata?.size / 1024).toFixed(0)} KB</span>
                                            <span>{new Date(file.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>

                                    <div className="mt-3 pt-3 border-t flex gap-2">
                                        <a
                                            href={getPublicUrl(file.name)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="w-full"
                                        >
                                            <Button variant="secondary" size="sm" className="w-full text-xs">
                                                <Download className="mr-2 h-3 w-3" /> Voir
                                            </Button>
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
