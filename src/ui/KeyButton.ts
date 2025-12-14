/**
 * KeyButton - Composant réutilisable pour afficher une touche de clavier stylisée
 *
 * Ce composant crée une représentation visuelle 3D moderne d'une touche de clavier,
 * utilisable dans le HUD, l'InteractionPrompt, le KeyboardIndicator, etc.
 *
 * Fonctionnalités :
 * - Effet 3D avec dégradé et ombre portée
 * - Trois tailles disponibles : small (32px), medium (48px), large (64px)
 * - Aspect "key cap" de clavier mécanique
 * - Animation au survol (optionnelle)
 *
 * @example
 * ```typescript
 * import { createKeyButton } from './ui/KeyButton';
 *
 * // Crée une touche moyenne (par défaut)
 * const keyZ = createKeyButton('Z');
 *
 * // Crée une petite touche
 * const keyE = createKeyButton('E', 'small');
 *
 * // Crée une grande touche
 * const keySpace = createKeyButton('Space', 'large');
 *
 * document.body.appendChild(keyZ);
 * ```
 */

/**
 * Type définissant les tailles disponibles pour une touche
 */
export type KeyButtonSize = "small" | "medium" | "large";

/**
 * Crée un élément HTML représentant une touche de clavier stylisée
 *
 * @param key - Le texte à afficher sur la touche (ex: "Z", "E", "Ctrl", "Échap")
 * @param size - La taille de la touche : "small" (32px), "medium" (48px), "large" (64px)
 * @returns Un élément HTMLDivElement stylisé en touche de clavier
 */
export function createKeyButton(
    key: string,
    size: KeyButtonSize = "medium",
): HTMLElement {
    // Crée le conteneur principal de la touche
    const button = document.createElement("div");
    button.className = `key-button key-button--${size}`;

    // Crée le label qui contient le texte de la touche
    const label = document.createElement("span");
    label.className = "key-button__label";
    label.textContent = key;

    // Assemble le composant
    button.appendChild(label);

    return button;
}
