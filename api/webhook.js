export default function handler(req, res) {
    // Configurer les headers CORS pour autoriser Qhare
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Gérer la requête preflight (OPTIONS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        try {
            const data = req.body;

            // Log pour le debugging dans Vercel
            console.log('Webhook Qhare Reçu:', JSON.stringify(data, null, 2));

            // TODO: Connecter ici Supabase pour sauvegarder le lead
            // const { data, error } = await supabase.from('clients').insert(...)

            return res.status(200).json({
                success: true,
                message: 'Webhook reçu avec succès',
                receivedData: data
            });
        } catch (error) {
            console.error('Erreur traitement webhook:', error);
            return res.status(500).json({ success: false, error: 'Erreur interne' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
