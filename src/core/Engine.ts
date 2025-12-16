import * as THREE from "three";
import { CSS2DRenderer } from "three/addons/renderers/CSS2DRenderer.js";
import type { EngineConfig } from "../data/types";

/**
 * Engine - Le cœur du moteur 3D
 *
 * Responsabilités :
 * - Créer et gérer la scène Three.js
 * - Gérer la caméra
 * - Gérer le renderer (affichage)
 * - Gérer la boucle de rendu (animation loop)
 * - Gérer le redimensionnement de la fenêtre
 */
export class Engine {
    // Les 3 éléments fondamentaux de Three.js
    private scene: THREE.Scene;
    private camera: THREE.PerspectiveCamera;
    private renderer: THREE.WebGLRenderer;

    private labelRenderer: CSS2DRenderer;

    // Conteneur HTML
    private container: HTMLElement;

    // Horloge pour calculer le temps entre chaque frame
    private clock: THREE.Clock;

    // Callbacks appelés à chaque frame
    private updateCallbacks: ((delta: number) => void)[] = [];

    constructor(config: EngineConfig = {}) {
        // 1. Récupère ou crée le conteneur
        this.container = config.container ?? document.body;

        // 2. Crée la scène (le monde 3D vide)
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color("#1a1a2e"); // Fond sombre

        // 3. Crée la caméra perspective
        // Paramètres : FOV, aspect ratio, near clipping, far clipping
        this.camera = new THREE.PerspectiveCamera(
            75, // FOV : 75 degrés (vision humaine ≈ 60-90°)
            window.innerWidth / window.innerHeight, // Ratio largeur/hauteur
            0.1, // Ne pas afficher les objets plus proches que 0.1 unités
            1000, // Ne pas afficher les objets plus loin que 1000 unités
        );
        // Position initiale de la caméra
        this.camera.position.set(0, 1.7, 5); // x, y (hauteur yeux), z

        // 4. Crée le renderer WebGL
        this.renderer = new THREE.WebGLRenderer({
            antialias: true, // Lisse les bords des objets
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limite pour les perfs

        // 5. Crée le renderer pour les labels CSS
        this.labelRenderer = new CSS2DRenderer();
        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
        this.labelRenderer.domElement.style.position = "absolute";
        this.labelRenderer.domElement.style.top = "0";
        this.labelRenderer.domElement.style.pointerEvents = "none";
        this.container.appendChild(this.labelRenderer.domElement);

        // 6. Ajoute le canvas au DOM
        this.container.appendChild(this.renderer.domElement);

        // 7. Initialise l'horloge
        this.clock = new THREE.Clock();

        // 8. Écoute le redimensionnement de la fenêtre
        window.addEventListener("resize", this.onResize.bind(this));

        // 9. Ajoute une lumière de base (sinon tout est noir)
        this.addBasicLighting();
    }

    /**
     * Ajoute un éclairage de base à la scène
     */
    private addBasicLighting(): void {
        // Lumière ambiante : éclaire tout uniformément (pas d'ombre)
        const ambientLight = new THREE.AmbientLight("#ffffff", 0.5);
        this.scene.add(ambientLight);

        // Lumière directionnelle : comme le soleil (crée des ombres)
        const directionalLight = new THREE.DirectionalLight("#ffffff", 1);
        directionalLight.position.set(5, 10, 5);
        this.scene.add(directionalLight);
    }

    /**
     * Gère le redimensionnement de la fenêtre
     */
    private onResize(): void {
        // Met à jour le ratio de la caméra
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        // Met à jour la taille du renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.labelRenderer.setSize(window.innerWidth, window.innerHeight);
    }

    /**
     * Boucle de rendu principale
     * Appelée ~60 fois par seconde (requestAnimationFrame)
     */
    private animate(): void {
        requestAnimationFrame(this.animate.bind(this));

        // Calcule le temps écoulé depuis la dernière frame
        const delta = this.clock.getDelta();

        // Appelle tous les callbacks de mise à jour
        for (const callback of this.updateCallbacks) {
            callback(delta);
        }

        // Dessine la scène
        this.renderer.render(this.scene, this.camera);

        this.labelRenderer.render(this.scene, this.camera);
    }

    /**
     * Démarre le moteur
     */
    public start(): void {
        this.animate();
    }

    /**
     * Enregistre une fonction à appeler à chaque frame
     * @param callback Fonction recevant le delta time en secondes
     */
    public onUpdate(callback: (delta: number) => void): void {
        this.updateCallbacks.push(callback);
    }

    /**
     * Ajoute un objet à la scène
     */
    public add(object: THREE.Object3D): void {
        this.scene.add(object);
    }

    /**
     * Retire un objet de la scène
     */
    public remove(object: THREE.Object3D): void {
        this.scene.remove(object);
    }

    /**
     * Retourne la scène (pour accès externe si besoin)
     */
    public getScene(): THREE.Scene {
        return this.scene;
    }

    /**
     * Retourne la caméra (pour le contrôle du joueur)
     */
    public getCamera(): THREE.PerspectiveCamera {
        return this.camera;
    }
}
