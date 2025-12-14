import type { CVData, Periode } from "../data/types";

/**
 * ApiService - Communication avec le backend
 */
export class ApiService {
    private baseUrl: string;

    constructor(baseUrl: string = "https://api.harruis.fr") {
        this.baseUrl = baseUrl;
    }

    /**
     * Récupère toutes les données du CV
     */
    public async getCV(): Promise<CVData> {
        const response = await fetch(`${this.baseUrl}/cv`);
        if (!response.ok) {
            throw new Error(`Erreur API: ${response.status}`);
        }
        return response.json();
    }

    /**
     * Récupère une période spécifique
     */
    public async getPeriode(id: string): Promise<Periode> {
        const response = await fetch(`${this.baseUrl}/cv/${id}`);
        if (!response.ok) {
            throw new Error(`Erreur API: ${response.status}`);
        }
        return response.json();
    }

    /**
     * Envoie un message via le formulaire de contact
     */
    public async sendContact(data: {
        nom: string;
        email: string;
        sujet: string;
        message: string;
    }): Promise<{ success: boolean; message: string }> {
        // Le serveur attend les champs en français (nom, sujet, email, message)
        const payload = {
            nom: data.nom,
            email: data.email,
            sujet: data.sujet,
            message: data.message,
        };

        const response = await fetch(`${this.baseUrl}/contact`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        // Essaie de récupérer le message d'erreur du serveur
        if (!response.ok) {
            let errorMessage = `Erreur ${response.status}`;

            // Lit d'abord le texte brut (on ne peut lire le body qu'une seule fois)
            const responseText = await response.text();
            console.error("❌ Réponse brute du serveur:", responseText);

            // Essaie de parser en JSON
            try {
                const errorData = JSON.parse(responseText);
                console.error("❌ Réponse d'erreur (JSON):", errorData);
                errorMessage =
                    errorData.message || errorData.error || errorMessage;
            } catch (e) {
                // Pas du JSON, utilise le texte brut
                console.error("❌ Réponse d'erreur (texte non-JSON)");
                if (responseText) {
                    errorMessage = responseText;
                }
            }

            throw new Error(errorMessage);
        }

        const result = await response.json();
        return result;
    }
}
