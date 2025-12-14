import { ApiService } from "../services/ApiService";
import { SuccessNotification } from "./SuccessNotification";

/**
 * ContactForm - Formulaire de contact avec système de double thème
 *
 * Responsabilités :
 * - Afficher un formulaire de contact avec validation en temps réel
 * - Permettre de basculer entre deux thèmes (Minimaliste / Terminal)
 * - Préserver les données saisies lors du changement de thème
 * - Gérer l'envoi via ApiService avec loader et notifications
 * - Intégrer avec OverlayManager pour l'affichage
 */

/**
 * Types de thèmes disponibles
 */
type Theme = "minimalist" | "terminal";

/**
 * Structure des données du formulaire
 */
interface FormData {
    name: string;
    email: string;
    subject: string;
    message: string;
}

/**
 * Règles de validation des champs
 */
interface ValidationRule {
    required: boolean;
    minLength?: number;
    pattern?: RegExp;
}

export class ContactForm {
    // Élément racine du formulaire
    private element: HTMLDivElement;

    // Thème actuel du formulaire
    private currentTheme: Theme = "minimalist";

    // Service API pour envoyer les données
    private apiService: ApiService;

    // Instance de la notification de succès
    private successNotification: SuccessNotification;

    // Règles de validation pour chaque champ
    private readonly validationRules: Record<string, ValidationRule> = {
        name: { required: true, minLength: 2 },
        email: {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        },
        subject: { required: true, minLength: 3 },
        message: { required: true, minLength: 10 },
    };

    // Messages d'erreur en français
    private readonly errorMessages: Record<string, string> = {
        name: "Le nom est requis (min. 2 caractères)",
        email: "Email invalide",
        subject: "Le sujet est requis (min. 3 caractères)",
        message: "Le message est requis (min. 10 caractères)",
    };

    // État de soumission du formulaire
    private isSubmitting = false;

    constructor() {
        this.apiService = new ApiService();
        this.successNotification = new SuccessNotification();

        // Crée la structure HTML du formulaire
        this.element = this.createFormStructure();

        // Attache les événements
        this.attachEventListeners();
    }

    /**
     * Crée la structure HTML complète du formulaire
     * @returns L'élément DOM du formulaire
     */
    private createFormStructure(): HTMLDivElement {
        const container = document.createElement("div");
        container.className = "contact-form";
        container.setAttribute("data-theme", this.currentTheme);

        container.innerHTML = `
            <div class="contact-form-header">
                <button class="theme-toggle" aria-label="Changer de thème" type="button">
                    🎨
                </button>
            </div>

            <form class="contact-form-content">
                <div class="form-group">
                    <label for="contact-name">${this.getLabel("name")}</label>
                    <input type="text" id="contact-name" name="name" required>
                    <span class="error-message"></span>
                </div>

                <div class="form-group">
                    <label for="contact-email">${this.getLabel("email")}</label>
                    <input type="email" id="contact-email" name="email" required>
                    <span class="error-message"></span>
                </div>

                <div class="form-group">
                    <label for="contact-subject">${this.getLabel("subject")}</label>
                    <input type="text" id="contact-subject" name="subject" required>
                    <span class="error-message"></span>
                </div>

                <div class="form-group">
                    <label for="contact-message">${this.getLabel("message")}</label>
                    <textarea id="contact-message" name="message" required></textarea>
                    <span class="error-message"></span>
                </div>

                <button type="submit" class="submit-button">
                    ${this.getSubmitButtonText()}
                </button>

                <div class="form-error"></div>
            </form>
        `;

        return container;
    }

    /**
     * Retourne le label adapté au thème actuel
     * @param field - Nom du champ
     */
    private getLabel(field: string): string {
        if (this.currentTheme === "terminal") {
            const labels: Record<string, string> = {
                name: "[ NOM/ENTREPRISE ]",
                email: "[ EMAIL ]",
                subject: "[ SUJET ]",
                message: "[ MESSAGE ]",
            };
            return labels[field] || field;
        } else {
            const labels: Record<string, string> = {
                name: "Nom / Entreprise",
                email: "Email",
                subject: "Sujet",
                message: "Message",
            };
            return labels[field] || field;
        }
    }

    /**
     * Retourne le texte du bouton de soumission adapté au thème
     */
    private getSubmitButtonText(): string {
        return this.currentTheme === "terminal"
            ? "> TRANSMETTRE_MESSAGE"
            : "Envoyer";
    }

    /**
     * Attache tous les événements nécessaires
     */
    private attachEventListeners(): void {
        // Toggle de thème
        const themeToggle = this.element.querySelector(".theme-toggle");
        themeToggle?.addEventListener("click", () => this.toggleTheme());

        // Validation en temps réel sur tous les inputs
        const inputs = this.element.querySelectorAll(
            "input, textarea",
        ) as NodeListOf<HTMLInputElement | HTMLTextAreaElement>;

        inputs.forEach((input) => {
            input.addEventListener("input", () => {
                this.validateField(input);
            });
        });

        // Soumission du formulaire
        const form = this.element.querySelector("form");
        form?.addEventListener("submit", (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
    }

    /**
     * Bascule entre les thèmes Minimaliste et Terminal
     * IMPORTANT : Préserve les valeurs des champs
     */
    private toggleTheme(): void {
        // Sauvegarde les valeurs actuelles des champs
        const formData = this.getFormData();

        // Change le thème
        this.currentTheme =
            this.currentTheme === "minimalist" ? "terminal" : "minimalist";

        // Met à jour l'attribut data-theme pour les styles CSS
        this.element.setAttribute("data-theme", this.currentTheme);

        // Met à jour les labels
        this.updateLabels();

        // Met à jour le texte du bouton de soumission
        const submitButton = this.element.querySelector(
            ".submit-button",
        ) as HTMLButtonElement;
        if (submitButton && !this.isSubmitting) {
            submitButton.textContent = this.getSubmitButtonText();
        }

        // Restaure les valeurs des champs
        this.setFormData(formData);

        // Re-valide tous les champs pour adapter l'affichage des erreurs au nouveau thème
        const inputs = this.element.querySelectorAll(
            "input, textarea",
        ) as NodeListOf<HTMLInputElement | HTMLTextAreaElement>;
        inputs.forEach((input) => this.validateField(input));
    }

    /**
     * Met à jour tous les labels selon le thème actuel
     */
    private updateLabels(): void {
        const labels = this.element.querySelectorAll("label");
        labels.forEach((label) => {
            const forAttribute = label.getAttribute("for");
            if (forAttribute) {
                const fieldName = forAttribute.replace("contact-", "");
                label.textContent = this.getLabel(fieldName);
            }
        });
    }

    /**
     * Récupère les données actuelles du formulaire
     */
    private getFormData(): FormData {
        const nameInput = this.element.querySelector(
            "#contact-name",
        ) as HTMLInputElement;
        const emailInput = this.element.querySelector(
            "#contact-email",
        ) as HTMLInputElement;
        const subjectInput = this.element.querySelector(
            "#contact-subject",
        ) as HTMLInputElement;
        const messageInput = this.element.querySelector(
            "#contact-message",
        ) as HTMLTextAreaElement;

        return {
            name: nameInput?.value || "",
            email: emailInput?.value || "",
            subject: subjectInput?.value || "",
            message: messageInput?.value || "",
        };
    }

    /**
     * Définit les données du formulaire
     * @param data - Données à injecter dans le formulaire
     */
    private setFormData(data: FormData): void {
        const nameInput = this.element.querySelector(
            "#contact-name",
        ) as HTMLInputElement;
        const emailInput = this.element.querySelector(
            "#contact-email",
        ) as HTMLInputElement;
        const subjectInput = this.element.querySelector(
            "#contact-subject",
        ) as HTMLInputElement;
        const messageInput = this.element.querySelector(
            "#contact-message",
        ) as HTMLTextAreaElement;

        if (nameInput) nameInput.value = data.name;
        if (emailInput) emailInput.value = data.email;
        if (subjectInput) subjectInput.value = data.subject;
        if (messageInput) messageInput.value = data.message;
    }

    /**
     * Valide un champ et affiche/masque le message d'erreur
     * @param input - Champ à valider
     * @returns true si le champ est valide, false sinon
     */
    private validateField(
        input: HTMLInputElement | HTMLTextAreaElement,
    ): boolean {
        const fieldName = input.name;
        const value = input.value.trim();
        const rule = this.validationRules[fieldName];

        if (!rule) return true;

        let isValid = true;
        let errorMessage = "";

        // Vérification : champ requis
        if (rule.required && value === "") {
            isValid = false;
            errorMessage = this.errorMessages[fieldName];
        }

        // Vérification : longueur minimale
        if (rule.minLength && value.length > 0 && value.length < rule.minLength) {
            isValid = false;
            errorMessage = this.errorMessages[fieldName];
        }

        // Vérification : pattern (pour l'email)
        if (rule.pattern && value.length > 0 && !rule.pattern.test(value)) {
            isValid = false;
            errorMessage = this.errorMessages[fieldName];
        }

        // Affichage de l'erreur
        this.displayFieldError(input, isValid, errorMessage);

        return isValid;
    }

    /**
     * Affiche ou masque le message d'erreur pour un champ
     * @param input - Champ concerné
     * @param isValid - true si le champ est valide
     * @param errorMessage - Message d'erreur à afficher
     */
    private displayFieldError(
        input: HTMLInputElement | HTMLTextAreaElement,
        isValid: boolean,
        errorMessage: string,
    ): void {
        const formGroup = input.closest(".form-group");
        const errorElement = formGroup?.querySelector(
            ".error-message",
        ) as HTMLElement;

        if (!errorElement) return;

        if (isValid) {
            // Champ valide : retire la classe d'erreur et masque le message
            formGroup?.classList.remove("has-error");
            errorElement.textContent = "";
        } else {
            // Champ invalide : ajoute la classe d'erreur et affiche le message
            formGroup?.classList.add("has-error");

            // Adapte le message au thème
            if (this.currentTheme === "terminal") {
                errorElement.textContent = `[ERREUR] ${errorMessage}`;
            } else {
                errorElement.textContent = errorMessage;
            }
        }
    }

    /**
     * Valide tous les champs du formulaire
     * @returns true si tous les champs sont valides, false sinon
     */
    private validateAllFields(): boolean {
        const inputs = this.element.querySelectorAll(
            "input, textarea",
        ) as NodeListOf<HTMLInputElement | HTMLTextAreaElement>;

        let allValid = true;

        inputs.forEach((input) => {
            const isValid = this.validateField(input);
            if (!isValid) {
                allValid = false;
            }
        });

        return allValid;
    }

    /**
     * Gère la soumission du formulaire
     * Workflow : Validation → Loader → API → Succès/Erreur
     */
    private async handleSubmit(): Promise<void> {
        // Empêche les soumissions multiples
        if (this.isSubmitting) return;

        // Étape 1 : Validation finale
        const isValid = this.validateAllFields();

        if (!isValid) {
            // Si erreurs : on ne soumet pas
            return;
        }

        // Étape 2 : Affichage du loader
        this.isSubmitting = true;
        this.showLoader();

        // Récupère les données du formulaire
        const formData = this.getFormData();

        try {
            // Étape 3 : Appel API avec délai minimum de 500ms
            const startTime = Date.now();

            const response = await this.apiService.sendContact({
                nom: formData.name,
                email: formData.email,
                sujet: formData.subject,
                message: formData.message,
            });

            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, 500 - elapsedTime);

            // Attendre le délai minimum si l'API a répondu trop rapidement
            if (remainingTime > 0) {
                await new Promise((resolve) => setTimeout(resolve, remainingTime));
            }

            // Étape 4a : Succès
            if (response.success) {
                // Ferme le formulaire (via l'OverlayManager qui gère l'animation)
                this.closeWithSuccess();

                // Affiche la notification de succès après un court délai
                setTimeout(() => {
                    this.successNotification.show();
                }, 300); // Délai pour laisser l'animation de fermeture se terminer
            } else {
                // Étape 4b : Erreur API (success: false)
                this.showFormError(
                    response.message || "Une erreur est survenue. Veuillez réessayer.",
                );
                this.hideLoader();
            }
        } catch (error) {
            // Étape 4b : Erreur réseau ou autre
            console.error("Erreur lors de l'envoi du formulaire :", error);

            // Affiche le message d'erreur du serveur si disponible
            const errorMessage = error instanceof Error
                ? error.message
                : "Échec de transmission. Réessayez.";

            this.showFormError(errorMessage);
            this.hideLoader();
        }
    }

    /**
     * Affiche le loader et désactive les champs
     */
    private showLoader(): void {
        const submitButton = this.element.querySelector(
            ".submit-button",
        ) as HTMLButtonElement;

        if (submitButton) {
            // Remplace le texte par un spinner
            submitButton.innerHTML = '<span class="spinner"></span>';
            submitButton.disabled = true;
        }

        // Désactive tous les champs
        const inputs = this.element.querySelectorAll(
            "input, textarea, button",
        ) as NodeListOf<
            HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement
        >;
        inputs.forEach((input) => {
            input.disabled = true;
        });
    }

    /**
     * Masque le loader et réactive les champs
     */
    private hideLoader(): void {
        this.isSubmitting = false;

        const submitButton = this.element.querySelector(
            ".submit-button",
        ) as HTMLButtonElement;

        if (submitButton) {
            // Restaure le texte du bouton
            submitButton.textContent = this.getSubmitButtonText();
            submitButton.disabled = false;
        }

        // Réactive tous les champs
        const inputs = this.element.querySelectorAll(
            "input, textarea, button",
        ) as NodeListOf<
            HTMLInputElement | HTMLTextAreaElement | HTMLButtonElement
        >;
        inputs.forEach((input) => {
            input.disabled = false;
        });
    }

    /**
     * Affiche un message d'erreur global sous le bouton de soumission
     * @param message - Message d'erreur à afficher
     */
    private showFormError(message: string): void {
        const errorElement = this.element.querySelector(
            ".form-error",
        ) as HTMLElement;

        if (errorElement) {
            // Adapte le message au thème
            if (this.currentTheme === "terminal") {
                errorElement.textContent = `[ERREUR SYSTÈME] ${message}`;
            } else {
                errorElement.textContent = message;
            }

            errorElement.style.display = "block";
        }
    }

    /**
     * Masque le message d'erreur global
     */
    private hideFormError(): void {
        const errorElement = this.element.querySelector(
            ".form-error",
        ) as HTMLElement;

        if (errorElement) {
            errorElement.textContent = "";
            errorElement.style.display = "none";
        }
    }

    /**
     * Ferme le formulaire suite à un envoi réussi
     * Déclenche la fermeture via l'OverlayManager (qui gère l'animation)
     */
    private closeWithSuccess(): void {
        // L'OverlayManager se chargera de fermer l'overlay
        // On déclenche un événement personnalisé que l'InputManager peut écouter
        const event = new CustomEvent("contactFormSuccess");
        this.element.dispatchEvent(event);
    }

    /**
     * Retourne l'élément DOM du formulaire
     * Utilisé par l'OverlayManager pour afficher le formulaire
     */
    public getElement(): HTMLDivElement {
        return this.element;
    }
}
