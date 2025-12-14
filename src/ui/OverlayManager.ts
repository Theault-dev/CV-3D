/**
 * OverlayManager - Gestionnaire centralisé des overlays avec système de pile
 *
 * Responsabilités :
 * - Gérer une pile d'overlays (LIFO - Last In First Out)
 * - Animer l'ouverture depuis le bouton déclencheur
 * - Gérer la fermeture avec animation
 * - Bloquer les inputs du jeu quand un overlay est actif
 * - Permettre la fermeture via Échap, bouton X ou clic sur backdrop
 */

/**
 * Représente un overlay dans la pile
 */
interface OverlayItem {
    backdrop: HTMLElement; // Élément racine (fond + container)
    container: HTMLElement; // Boîte centrale
    content: HTMLElement; // Contenu injecté
    closeButton: HTMLElement; // Bouton de fermeture
}

export class OverlayManager {
    // Pile d'overlays actifs (le dernier élément est au-dessus)
    private overlayStack: OverlayItem[] = [];

    // Durées d'animation en millisecondes
    private readonly OPEN_DURATION = 300;
    private readonly CLOSE_DURATION = 200;

    constructor() {
        // Écoute les clics sur les backdrops pour fermeture
        document.addEventListener("click", this.onDocumentClick.bind(this));
    }

    /**
     * Ouvre un nouvel overlay et l'ajoute à la pile
     *
     * @param content - Élément HTML à afficher dans l'overlay
     * @param triggerButton - (Optionnel) Bouton qui a déclenché l'overlay pour l'animation
     */
    public open(content: HTMLElement, triggerButton?: HTMLElement): void {
        // Crée la structure HTML de l'overlay
        const overlayItem = this.createOverlayStructure(content);

        // Ajoute au DOM
        document.body.appendChild(overlayItem.backdrop);

        // Ajoute à la pile
        this.overlayStack.push(overlayItem);

        // Lance l'animation d'ouverture
        requestAnimationFrame(() => {
            this.animateOpen(overlayItem, triggerButton);
        });
    }

    /**
     * Ferme le dernier overlay de la pile (LIFO)
     */
    public close(): void {
        if (this.overlayStack.length === 0) {
            return;
        }

        const overlayItem = this.overlayStack.pop()!;

        // Lance l'animation de fermeture
        this.animateClose(overlayItem);
    }

    /**
     * Ferme tous les overlays de la pile
     */
    public closeAll(): void {
        while (this.overlayStack.length > 0) {
            this.close();
        }
    }

    /**
     * Vérifie si au moins un overlay est actif
     * Utilisé par InputManager pour bloquer les inputs du jeu
     */
    public hasActiveOverlay(): boolean {
        return this.overlayStack.length > 0;
    }

    /**
     * Crée la structure HTML complète d'un overlay
     *
     * Structure :
     * <div class="overlay-backdrop">
     *   <div class="overlay-container">
     *     <button class="overlay-close">×</button>
     *     <div class="overlay-content">
     *       [contenu injecté]
     *     </div>
     *   </div>
     * </div>
     */
    private createOverlayStructure(content: HTMLElement): OverlayItem {
        // Backdrop (fond semi-transparent avec blur)
        const backdrop = document.createElement("div");
        backdrop.className = "overlay-backdrop";
        backdrop.style.opacity = "0"; // Démarre invisible pour l'animation

        // Container (boîte centrale)
        const container = document.createElement("div");
        container.className = "overlay-container";
        container.style.opacity = "0"; // Démarre invisible
        container.style.transform = "scale(0.8)"; // Démarre réduit

        // Bouton de fermeture
        const closeButton = document.createElement("button");
        closeButton.className = "overlay-close";
        closeButton.textContent = "×";
        closeButton.setAttribute("aria-label", "Fermer");
        closeButton.addEventListener("click", (e) => {
            e.stopPropagation(); // Empêche la propagation au backdrop
            this.close();
        });

        // Wrapper pour le contenu
        const contentWrapper = document.createElement("div");
        contentWrapper.className = "overlay-content";
        contentWrapper.appendChild(content);

        // Empêche la propagation des clics sur le container
        // (pour que le clic sur backdrop ferme mais pas sur le container)
        container.addEventListener("click", (e) => {
            e.stopPropagation();
        });

        // Assemble la structure
        container.appendChild(closeButton);
        container.appendChild(contentWrapper);
        backdrop.appendChild(container);

        return {
            backdrop,
            container,
            content: contentWrapper,
            closeButton,
        };
    }

    /**
     * Anime l'ouverture de l'overlay
     *
     * Si un bouton déclencheur est fourni :
     * - Part de la position du bouton vers le centre
     * Sinon :
     * - Fade-in simple depuis le centre
     */
    private animateOpen(
        overlayItem: OverlayItem,
        triggerButton?: HTMLElement,
    ): void {
        const { backdrop, container } = overlayItem;

        // Si on a un bouton déclencheur, calcule la transformation initiale
        if (triggerButton) {
            const buttonRect = triggerButton.getBoundingClientRect();
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;

            // Centre du bouton
            const buttonCenterX = buttonRect.left + buttonRect.width / 2;
            const buttonCenterY = buttonRect.top + buttonRect.height / 2;

            // Delta entre le bouton et le centre de l'écran
            const deltaX = buttonCenterX - centerX;
            const deltaY = buttonCenterY - centerY;

            // Position initiale : au niveau du bouton
            container.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(0.1)`;
        } else {
            // Sinon, démarre au centre mais petit
            container.style.transform = "scale(0.8)";
        }

        // Force le reflow pour que la transition fonctionne
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        container.offsetHeight;

        // Active les transitions CSS
        backdrop.style.transition = `opacity ${this.OPEN_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        container.style.transition = `all ${this.OPEN_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;

        // Animation vers l'état final
        backdrop.style.opacity = "1";
        container.style.opacity = "1";
        container.style.transform = "translate(0, 0) scale(1)";
    }

    /**
     * Anime la fermeture de l'overlay
     *
     * Fade-out + scale down vers le centre
     * Supprime du DOM après l'animation
     */
    private animateClose(overlayItem: OverlayItem): void {
        const { backdrop, container } = overlayItem;

        // Active les transitions
        backdrop.style.transition = `opacity ${this.CLOSE_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;
        container.style.transition = `all ${this.CLOSE_DURATION}ms cubic-bezier(0.4, 0, 0.2, 1)`;

        // Animation de fermeture
        backdrop.style.opacity = "0";
        container.style.opacity = "0";
        container.style.transform = "scale(0.9)";

        // Supprime du DOM après l'animation
        setTimeout(() => {
            if (backdrop.parentNode) {
                backdrop.parentNode.removeChild(backdrop);
            }
        }, this.CLOSE_DURATION);
    }

    /**
     * Gère les clics sur le document
     * Si on clique sur un backdrop, ferme l'overlay correspondant
     */
    private onDocumentClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;

        // Vérifie si on a cliqué sur un backdrop
        if (target.classList.contains("overlay-backdrop")) {
            // Ferme le dernier overlay (celui cliqué)
            this.close();
        }
    }

    /**
     * Nettoyage (si besoin de détruire l'OverlayManager)
     */
    public dispose(): void {
        // Ferme tous les overlays
        this.closeAll();

        // Retire les event listeners
        document.removeEventListener("click", this.onDocumentClick.bind(this));
    }
}
