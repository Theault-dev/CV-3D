import type { OverlayManager } from "../ui/OverlayManager";
import { ContactForm } from "../ui/ContactForm";

/**
 * InputManager - Gestion des entrées utilisateur
 *
 * Responsabilités :
 * - Écouter les événements clavier
 * - Maintenir l'état des touches (enfoncée/relâchée)
 * - Fournir une API simple pour interroger l'état
 * - Bloquer les inputs du jeu quand un overlay est actif
 * - Gérer l'ouverture/fermeture du formulaire de contact (touche C)
 * - (Plus tard) Gérer le joystick virtuel mobile
 */
export class InputManager {
    // Map des touches actuellement enfoncées
    // Ex: { "z": true, "q": true } si Z et Q sont enfoncées
    private keys: Map<string, boolean> = new Map();

    // Direction de mouvement normalisée (-1 à 1)
    private movement = { x: 0, z: 0 };

    // Touches qui viennent d'être pressées (pour les actions uniques)
    private justPressed: Set<string> = new Set();

    // Référence au gestionnaire d'overlays (pour bloquer les inputs)
    private overlayManager: OverlayManager | null = null;

    constructor() {
        // Écoute les événements clavier
        window.addEventListener("keydown", this.onKeyDown.bind(this));
        window.addEventListener("keyup", this.onKeyUp.bind(this));

        // Réinitialise les touches si l'utilisateur quitte l'onglet
        // (évite les touches "bloquées")
        window.addEventListener("blur", this.onBlur.bind(this));
    }

    /**
     * Définit le gestionnaire d'overlays
     * Doit être appelé après la création de l'OverlayManager
     */
    public setOverlayManager(overlayManager: OverlayManager): void {
        this.overlayManager = overlayManager;
    }

    /**
     * Appelé quand une touche est enfoncée
     */
    private onKeyDown(event: KeyboardEvent): void {
        // Ignore les événements sans key (composition IME, etc.)
        if (!event.key) return;

        const key = event.key.toLowerCase();

        // Gestion spéciale de la touche Échap avec les overlays
        if (key === "escape") {
            // Si un overlay est actif, on le ferme et on bloque tout le reste
            if (this.overlayManager?.hasActiveOverlay()) {
                this.overlayManager.close();
                event.preventDefault();
                return; // Bloque le traitement normal de la touche
            }
        }

        // Gestion de la touche C pour ouvrir/fermer le formulaire de contact
        if (key === "c") {
            // Si un overlay est actif, on le ferme
            if (this.overlayManager?.hasActiveOverlay()) {
                this.overlayManager.close();
                event.preventDefault();
                return;
            }

            // Sinon, on ouvre le formulaire de contact
            // Récupère le bouton "C Contact" du HUD pour l'animation
            const contactButton = document.querySelector(
                '.hud-key[data-key="c"]',
            ) as HTMLElement;

            // Crée une nouvelle instance du formulaire
            const contactForm = new ContactForm();

            // Écoute l'événement de succès pour fermer l'overlay
            contactForm.getElement().addEventListener(
                "contactFormSuccess",
                () => {
                    this.overlayManager?.close();
                },
            );

            // Ouvre le formulaire dans un overlay avec animation depuis le bouton
            this.overlayManager?.open(
                contactForm.getElement(),
                contactButton || undefined,
            );

            event.preventDefault();
            return; // Bloque le traitement normal de la touche
        }

        // Si un overlay est actif, on ne traite PAS les touches comme des commandes de jeu
        // mais on les laisse se propager pour permettre la saisie dans les inputs
        if (this.overlayManager?.hasActiveOverlay()) {
            // Ne pas enregistrer les touches ni mettre à jour le mouvement
            // Les touches peuvent toujours être utilisées pour écrire dans les formulaires
            return;
        }

        // Comportement normal : pas d'overlay actif
        if (
            [
                "z",
                "q",
                "s",
                "d",
                "arrowup",
                "arrowdown",
                "arrowleft",
                "arrowright",
                " ",
                "e",
            ].includes(key)
        ) {
            event.preventDefault();
        }

        // Marque comme "vient d'être pressée" AVANT de mettre à jour keys
        if (!this.keys.get(key)) {
            this.justPressed.add(key);
        }

        // Marque la touche comme enfoncée
        this.keys.set(key, true);

        this.updateMovement();
    }

    /**
     * Appelé quand une touche est relâchée
     */
    private onKeyUp(event: KeyboardEvent): void {
        // Ignore les événements sans key (composition IME, etc.)
        if (!event.key) return;

        const key = event.key.toLowerCase();

        // Marque la touche comme relâchée
        this.keys.set(key, false);

        // Met à jour le vecteur de mouvement
        this.updateMovement();
    }

    /**
     * Réinitialise toutes les touches (quand l'onglet perd le focus)
     */
    private onBlur(): void {
        this.keys.clear();
        this.movement = { x: 0, z: 0 };
    }

    /**
     * Calcule le vecteur de mouvement à partir des touches enfoncées
     *
     * Convention Three.js :
     * - X positif = droite
     * - X négatif = gauche
     * - Z positif = vers la caméra (reculer)
     * - Z négatif = loin de la caméra (avancer)
     */
    private updateMovement(): void {
        let x = 0;
        let z = 0;

        // Avancer (Z ou flèche haut)
        if (this.isKeyDown("z") || this.isKeyDown("arrowup")) {
            z -= 1;
        }

        // Reculer (S ou flèche bas)
        if (this.isKeyDown("s") || this.isKeyDown("arrowdown")) {
            z += 1;
        }

        // Gauche (Q ou flèche gauche)
        if (this.isKeyDown("q") || this.isKeyDown("arrowleft")) {
            x -= 1;
        }

        // Droite (D ou flèche droite)
        if (this.isKeyDown("d") || this.isKeyDown("arrowright")) {
            x += 1;
        }

        // Normalise le vecteur pour que la diagonale ne soit pas plus rapide
        // (sinon Z+D = √2 ≈ 1.41 au lieu de 1)
        const length = Math.sqrt(x * x + z * z);
        if (length > 0) {
            x /= length;
            z /= length;
        }

        this.movement = { x, z };
    }

    /**
     * Vérifie si une touche est actuellement enfoncée
     */
    public isKeyDown(key: string): boolean {
        return this.keys.get(key.toLowerCase()) === true;
    }

    /**
     * Retourne le vecteur de mouvement actuel
     * x: -1 (gauche) à 1 (droite)
     * z: -1 (avancer) à 1 (reculer)
     */
    public getMovement(): { x: number; z: number } {
        return this.movement;
    }

    /**
     * Vérifie si le joueur veut bouger (une touche de direction est enfoncée)
     */
    public isMoving(): boolean {
        return this.movement.x !== 0 || this.movement.z !== 0;
    }

    /**
     * Nettoyage (si besoin de détruire l'InputManager)
     */
    public dispose(): void {
        window.removeEventListener("keydown", this.onKeyDown.bind(this));
        window.removeEventListener("keyup", this.onKeyUp.bind(this));
        window.removeEventListener("blur", this.onBlur.bind(this));
    }

    /**
     * Vérifie si une touche vient d'être pressée (une seule fois)
     * Se réinitialise après l'appel
     */
    public isKeyJustPressed(key: string): boolean {
        const k = key.toLowerCase();
        if (this.justPressed.has(k)) {
            this.justPressed.delete(k);
            return true;
        }
        return false;
    }
}
