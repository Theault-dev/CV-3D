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

        const response = await fetch(`${this.baseUrl}/contact`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            throw new Error(`Erreur API: ${response.status}`);
        }
        return response.json();
    }
}
