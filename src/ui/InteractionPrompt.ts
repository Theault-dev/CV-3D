import { createKeyButton } from "./KeyButton";

/**
 * InteractionPrompt - Affiche un message d'interaction à l'écran
 *
 * Utilise le composant KeyButton pour une cohérence visuelle avec le reste de l'UI
 */
export class InteractionPrompt {
    private element: HTMLDivElement;
    private textElement: HTMLSpanElement;

    constructor() {
        this.element = document.createElement("div");
        this.element.id = "interaction-prompt";

        // Crée la touche E avec le composant réutilisable
        const keyButton = createKeyButton("E", "small");

        // Crée le texte
        this.textElement = document.createElement("span");
        this.textElement.className = "interaction-prompt__text";
        this.textElement.textContent = "Entrer";

        // Assemble les éléments
        this.element.appendChild(keyButton);
        this.element.appendChild(this.textElement);

        this.hide();
        document.body.appendChild(this.element);

        this.addStyles();
    }

    private addStyles(): void {
        const style = document.createElement("style");
        style.textContent = `
      #interaction-prompt {
        position: fixed;
        bottom: 20%;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 24px;
        background: rgba(0, 0, 0, 0.8);
        border-radius: 8px;
        font-family: Arial, sans-serif;
        color: #ffffff;
        opacity: 0;
        transition: opacity 0.2s ease;
        pointer-events: none;
      }

      #interaction-prompt.visible {
        opacity: 1;
      }

      #interaction-prompt .interaction-prompt__text {
        font-size: 16px;
      }
    `;
        document.head.appendChild(style);
    }

    public show(text: string = "Entrer"): void {
        this.textElement.textContent = text;
        this.element.classList.add("visible");
    }

    public hide(): void {
        this.element.classList.remove("visible");
    }
}
