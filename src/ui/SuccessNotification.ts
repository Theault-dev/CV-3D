/**
 * SuccessNotification - Notification de succès style Xbox
 *
 * Responsabilités :
 * - Afficher une notification élégante après l'envoi réussi du formulaire
 * - Gérer les animations slide-up et slide-down
 * - Auto-fermeture après 3 secondes
 */

export class SuccessNotification {
    // Élément DOM de la notification
    private element: HTMLDivElement | null = null;

    // Durée d'affichage en millisecondes
    private readonly DISPLAY_DURATION = 3000;

    // Durées d'animation en millisecondes
    private readonly SLIDE_DURATION = 400;

    // Timer pour l'auto-fermeture
    private autoCloseTimer: number | null = null;

    constructor() {
        // La notification sera créée à la demande lors de l'appel à show()
    }

    /**
     * Crée la structure HTML de la notification
     */
    private createNotificationStructure(): HTMLDivElement {
        const notification = document.createElement("div");
        notification.className = "success-notification";

        notification.innerHTML = `
            <span class="success-icon">✓</span>
            <span class="success-message">Premier contact établi !</span>
        `;

        return notification;
    }

    /**
     * Affiche la notification avec animation slide-up
     * Lance l'auto-fermeture après DISPLAY_DURATION
     */
    public show(): void {
        // Si une notification est déjà affichée, on la masque d'abord
        if (this.element && this.element.parentNode) {
            this.hide();
        }

        // Crée la nouvelle notification
        this.element = this.createNotificationStructure();

        // Ajoute au DOM (hors de l'écran initialement)
        document.body.appendChild(this.element);

        // Force le reflow pour que l'animation fonctionne
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        this.element.offsetHeight;

        // Déclenche l'animation d'apparition
        requestAnimationFrame(() => {
            if (this.element) {
                this.element.classList.add("show");
            }
        });

        // Programme l'auto-fermeture
        this.autoCloseTimer = window.setTimeout(() => {
            this.hide();
        }, this.DISPLAY_DURATION);
    }

    /**
     * Masque la notification avec animation slide-down
     * Supprime du DOM après l'animation
     */
    public hide(): void {
        if (!this.element) return;

        // Annule le timer d'auto-fermeture si en cours
        if (this.autoCloseTimer !== null) {
            clearTimeout(this.autoCloseTimer);
            this.autoCloseTimer = null;
        }

        // Retire la classe "show" pour déclencher l'animation de sortie
        this.element.classList.remove("show");

        // Supprime du DOM après l'animation
        setTimeout(() => {
            if (this.element && this.element.parentNode) {
                this.element.parentNode.removeChild(this.element);
                this.element = null;
            }
        }, this.SLIDE_DURATION);
    }

    /**
     * Vérifie si la notification est actuellement affichée
     */
    public isVisible(): boolean {
        return this.element !== null && this.element.classList.contains("show");
    }

    /**
     * Nettoyage (si besoin de détruire la notification)
     */
    public dispose(): void {
        this.hide();

        if (this.autoCloseTimer !== null) {
            clearTimeout(this.autoCloseTimer);
            this.autoCloseTimer = null;
        }
    }
}
