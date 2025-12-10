/**
 * InteractionPrompt - Affiche un message d'interaction à l'écran
 */
export class InteractionPrompt {
    private element: HTMLDivElement;

    constructor() {
        this.element = document.createElement("div");
        this.element.id = "interaction-prompt";
        this.element.innerHTML = `
      <span class="key">E</span>
      <span class="text">Entrer</span>
    `;
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
        color: white;
        opacity: 0;
        transition: opacity 0.2s ease;
        pointer-events: none;
      }

      #interaction-prompt.visible {
        opacity: 1;
      }

      #interaction-prompt .key {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        background: #4a90d9;
        border-radius: 6px;
        font-weight: bold;
        font-size: 18px;
      }

      #interaction-prompt .text {
        font-size: 16px;
      }
    `;
        document.head.appendChild(style);
    }

    public show(text: string = "Entrer"): void {
        this.element.querySelector(".text")!.textContent = text;
        this.element.classList.add("visible");
    }

    public hide(): void {
        this.element.classList.remove("visible");
    }
}
