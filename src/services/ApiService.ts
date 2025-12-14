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
        // Convertit les champs français en anglais pour l'API
        const payload = {
            name: data.nom,
            email: data.email,
            subject: data.sujet,
            message: data.message,
        };

        console.log("📧 Envoi du formulaire de contact:", payload);

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
            try {
                const errorData = await response.json();
                console.error("❌ Réponse d'erreur du serveur:", errorData);
                errorMessage = errorData.message || errorData.error || errorMessage;
            } catch (e) {
                // Si le serveur ne retourne pas de JSON, on lit le texte brut
                const errorText = await response.text();
                console.error("❌ Réponse d'erreur (texte):", errorText);
                if (errorText) {
                    errorMessage = errorText;
                }
            }
            throw new Error(errorMessage);
        }

        const result = await response.json();
        console.log("✅ Réponse du serveur:", result);
        return result;
    }
}
