import { createKeyButton } from "./KeyButton";

/**
 * KeyboardIndicator - Affiche les touches de déplacement détectées automatiquement
 *
 * Ce composant affiche un indicateur visuel des touches de déplacement (ZQSD ou WASD)
 * en bas de l'écran, avec détection automatique du layout clavier (AZERTY/QWERTY).
 *
 * Fonctionnalités :
 * - Détection automatique AZERTY/QWERTY avec fallback sur la langue
 * - Affichage automatique au chargement (5 secondes)
 * - Toggle on/off avec la touche H
 * - Animations slide-up/slide-down fluides
 * - Timer auto-hide de 5 secondes (qui se reset à chaque affichage)
 *
 * Usage :
 * ```typescript
 * const indicator = new KeyboardIndicator();
 * await indicator.init();
 * indicator.show(); // Affiche l'indicateur
 * indicator.toggle(); // Toggle on/off
 * ```
 */

/**
 * Type définissant les layouts de clavier supportés
 */
export type KeyboardLayout = "azerty" | "qwerty";

/**
 * Configuration des touches de déplacement selon le layout
 */
interface MovementKeys {
    forward: string;
    left: string;
    backward: string;
    right: string;
}

/**
 * Classe gérant l'indicateur de touches de déplacement
 */
export class KeyboardIndicator {
    // Élément DOM de l'indicateur
    private element: HTMLElement | null = null;

    // Timer pour masquer automatiquement après 5 secondes
    private hideTimer: number | null = null;

    // État de visibilité actuel
    private isVisible: boolean = false;

    // Layout clavier détecté (AZERTY ou QWERTY)
    private layout: KeyboardLayout = "azerty";

    /**
     * Initialise l'indicateur
     * Détecte le layout clavier et crée l'élément DOM
     */
    public async init(): Promise<void> {
        // Détecte le layout clavier de l'utilisateur
        this.layout = await this.detectKeyboardLayout();

        // Crée l'élément DOM avec les bonnes touches
        this.element = this.create();

        // Ajoute l'élément au DOM
        document.body.appendChild(this.element);
    }

    /**
     * Affiche l'indicateur avec animation slide-up
     * Si déjà visible, reset simplement le timer
     */
    public show(): void {
        if (!this.element) {
            console.warn("⚠️ KeyboardIndicator non initialisé");
            return;
        }

        // Annule le timer précédent si existant
        if (this.hideTimer !== null) {
            clearTimeout(this.hideTimer);
            this.hideTimer = null;
        }

        // Si déjà visible, juste reset le timer
        if (this.isVisible) {
            this.startHideTimer();
            return;
        }

        // Afficher avec animation
        this.element.classList.remove("hiding");
        this.element.classList.add("visible");
        this.isVisible = true;

        // Démarrer le timer de 5 secondes
        this.startHideTimer();
    }

    /**
     * Masque l'indicateur avec animation slide-down
     */
    public hide(): void {
        if (!this.element || !this.isVisible) {
            return;
        }

        // Annuler le timer
        if (this.hideTimer !== null) {
            clearTimeout(this.hideTimer);
            this.hideTimer = null;
        }

        // Masquer avec animation
        this.element.classList.remove("visible");
        this.element.classList.add("hiding");
        this.isVisible = false;
    }

    /**
     * Toggle l'affichage de l'indicateur
     * Utilisé par la touche H
     */
    public toggle(): void {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Démarre le timer de masquage automatique (5 secondes)
     */
    private startHideTimer(): void {
        this.hideTimer = window.setTimeout(() => {
            this.hide();
        }, 5000);
    }

    /**
     * Crée l'élément DOM de l'indicateur avec les touches appropriées
     */
    private create(): HTMLElement {
        // Récupère les touches selon le layout détecté
        const keys = this.getMovementKeys();

        // Conteneur principal
        const container = document.createElement("div");
        container.className = "keyboard-indicator";

        // Conteneur du contenu
        const content = document.createElement("div");
        content.className = "keyboard-indicator__content";

        // Ligne 1 : Touche avant (Z ou W)
        const row1 = document.createElement("div");
        row1.className = "keyboard-indicator__row";
        row1.appendChild(this.createKeyGroup(keys.forward, "Avancer"));

        // Ligne 2 : Touches gauche/arrière/droite
        const row2 = document.createElement("div");
        row2.className = "keyboard-indicator__row";
        row2.appendChild(this.createKeyGroup(keys.left, "Gauche"));
        row2.appendChild(this.createKeyGroup(keys.backward, "Reculer"));
        row2.appendChild(this.createKeyGroup(keys.right, "Droite"));

        // Assemblage
        content.appendChild(row1);
        content.appendChild(row2);
        container.appendChild(content);

        return container;
    }

    /**
     * Crée un groupe touche + label
     */
    private createKeyGroup(key: string, label: string): HTMLElement {
        const group = document.createElement("div");
        group.className = "keyboard-indicator__key-group";

        // Touche (utilise le composant réutilisable)
        const keyButton = createKeyButton(key, "medium");

        // Label
        const labelElement = document.createElement("span");
        labelElement.className = "keyboard-indicator__label";
        labelElement.textContent = label;

        // Assemblage
        group.appendChild(keyButton);
        group.appendChild(labelElement);

        return group;
    }

    /**
     * Retourne les touches de déplacement selon le layout
     */
    private getMovementKeys(): MovementKeys {
        if (this.layout === "azerty") {
            return {
                forward: "Z",
                left: "Q",
                backward: "S",
                right: "D",
            };
        } else {
            // QWERTY
            return {
                forward: "W",
                left: "A",
                backward: "S",
                right: "D",
            };
        }
    }

    /**
     * Détecte le layout du clavier (AZERTY ou QWERTY)
     * Utilise 3 méthodes en cascade :
     * 1. API Keyboard (si disponible)
     * 2. LocalStorage (apprentissage)
     * 3. Langue du navigateur (fallback)
     */
    private async detectKeyboardLayout(): Promise<KeyboardLayout> {
        // Méthode 1 : Essayer l'API Keyboard
        // @ts-ignore - L'API Keyboard n'est pas encore dans les types TypeScript standard
        if (
            "keyboard" in navigator &&
            typeof (navigator as any).keyboard?.getLayoutMap === "function"
        ) {
            try {
                // @ts-ignore - L'API Keyboard n'est pas encore dans les types TypeScript standard
                const layoutMap = await navigator.keyboard.getLayoutMap();
                const keyW = layoutMap.get("KeyW");

                // Si KeyW retourne 'z' → AZERTY
                // Si KeyW retourne 'w' → QWERTY
                if (keyW === "z") {
                    this.saveLayout("azerty");
                    return "azerty";
                } else if (keyW === "w") {
                    this.saveLayout("qwerty");
                    return "qwerty";
                }
            } catch (error) {
                console.warn("⚠️ Keyboard API error:", error);
            }
        }

        // Méthode 2 : Vérifier localStorage (apprentissage)
        const saved = localStorage.getItem("keyboard-layout");
        if (saved === "azerty" || saved === "qwerty") {
            return saved;
        }

        // Méthode 3 : Fallback sur la langue du navigateur
        const lang = navigator.language.toLowerCase();
        const isAzerty = lang.startsWith("fr") || lang.startsWith("be");
        const fallbackLayout: KeyboardLayout = isAzerty ? "azerty" : "qwerty";

        this.saveLayout(fallbackLayout);
        return fallbackLayout;
    }

    /**
     * Sauvegarde le layout détecté dans localStorage
     */
    private saveLayout(layout: KeyboardLayout): void {
        try {
            localStorage.setItem("keyboard-layout", layout);
        } catch (error) {
            // Ignore les erreurs (mode privé, etc.)
        }
    }
}
