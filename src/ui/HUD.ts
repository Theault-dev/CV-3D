/**
 * HUD (Heads-Up Display) - Affiche les raccourcis clavier permanents
 *
 * Ce composant affiche un panneau dans le coin inférieur droit avec les touches
 * disponibles en permanence (hors touches contextuelles comme E ou Échap).
 */
export class HUD {
    private element: HTMLDivElement;

    /**
     * Touches affichées dans le HUD permanent
     * Les touches contextuelles (E, Échap, etc.) sont gérées séparément
     */
    private readonly shortcuts = [
        { key: "H", description: "Touches de déplacement" },
        { key: "C", description: "Formulaire contact" },
        { key: "M", description: "Musique on/off" },
        { key: "Tab", description: "Salles visitées" },
        { key: "I", description: "Infos salle actuelle" },
    ];

    constructor() {
        this.element = document.createElement("div");
        this.element.id = "hud-container";
        this.element.className = "hud-container";

        // Crée le contenu du HUD
        this.element.innerHTML = this.buildHTML();

        // Commence invisible pour l'animation d'entrée
        this.element.style.opacity = "0";

        document.body.appendChild(this.element);

        // Animation d'apparition subtile après un court délai
        requestAnimationFrame(() => {
            setTimeout(() => {
                this.element.style.opacity = "1";
            }, 100);
        });
    }

    /**
     * Construit le HTML du HUD avec toutes les touches
     */
    private buildHTML(): string {
        const shortcutItems = this.shortcuts
            .map(
                (shortcut) => `
            <div class="hud-item">
                <span class="hud-key" data-key="${shortcut.key.toLowerCase()}">${shortcut.key}</span>
                <span class="hud-description">${shortcut.description}</span>
            </div>
        `,
            )
            .join("");

        return `<div class="hud-shortcuts">${shortcutItems}</div>`;
    }

    /**
     * Affiche le HUD (si caché)
     */
    public show(): void {
        this.element.style.display = "block";
        // Animation de fondu
        setTimeout(() => {
            this.element.style.opacity = "1";
        }, 10);
    }

    /**
     * Cache le HUD
     */
    public hide(): void {
        this.element.style.opacity = "0";
        setTimeout(() => {
            this.element.style.display = "none";
        }, 200);
    }

    /**
     * Met à jour la visibilité d'une touche spécifique
     * Utile si certaines touches doivent être cachées temporairement
     *
     * @param key - La touche à modifier
     * @param visible - true pour afficher, false pour cacher
     */
    public setKeyVisible(key: string, visible: boolean): void {
        const items = this.element.querySelectorAll(".hud-item");
        items.forEach((item) => {
            const keyElement = item.querySelector(".hud-key");
            if (keyElement?.textContent === key) {
                (item as HTMLElement).style.display = visible ? "flex" : "none";
            }
        });
    }

    /**
     * Retourne l'élément DOM du HUD
     */
    public getElement(): HTMLDivElement {
        return this.element;
    }
}
