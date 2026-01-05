import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

/**
 * Configuration d'une porte
 */
export interface DoorConfig {
    /** ID unique (correspond à l'ID de la période dans l'API) */
    id: string;
    /** Titre affiché au-dessus de la porte */
    title: string;
    /** Sous-titre (dates) */
    subtitle: string;
    /** Position de la porte */
    position: THREE.Vector3;
    /** Rotation Y en radians */
    rotation?: number;
    /** Couleur de la porte */
    color?: string;
}

/**
 * Door - Une porte menant à une période du CV
 */
export class Door {
    private group: THREE.Group;
    private id: string;
    private isHighlighted: boolean = false;
    private isOpen: boolean = false;
    private isAnimating: boolean = false;

    // Animation
    private mixer: THREE.AnimationMixer | null = null;
    private animations: THREE.AnimationClip[] = [];
    private openAction: THREE.AnimationAction | null = null;
    private doorModel: THREE.Group | null = null;

    // Dimensions calculées du modèle
    private modelHeight: number = 2.5;

    // ==================== CONFIGURATION DU MODÈLE ====================
    private static readonly MODEL_PATH = "/models/animated/simple_door.glb";
    private static readonly MODEL_SCALE = 0.9; // Échelle du modèle (1.0 = taille normale)
    private static readonly MODEL_COLOR: string | null = "#8b7355"; // Couleur (ex: "#ff0000", null pour couleur originale)
    private static readonly ANIMATION_SPEED = 3; // Vitesse de l'animation (1.0 = vitesse normale, 2.0 = 2x plus rapide)
    // =================================================================

    private static loader: GLTFLoader = new GLTFLoader();
    private static cachedModel: THREE.Group | null = null;
    private static cachedAnimations: THREE.AnimationClip[] = [];
    private static loadingPromise: Promise<void> | null = null;

    constructor(config: DoorConfig) {
        this.id = config.id;
        this.group = new THREE.Group();

        // Position et rotation
        this.group.position.copy(config.position);
        if (config.rotation) {
            this.group.rotation.y = config.rotation;
        }

        // Charge le modèle GLTF de manière asynchrone
        this.loadDoorModel();

        // Crée le texte (titre + dates)
        this.createText(config.title, config.subtitle);
    }

    /**
     * Charge le modèle GLTF de la porte (avec système de cache)
     */
    private async loadDoorModel(): Promise<void> {
        try {
            // Si le modèle n'est pas en cache, on le charge
            if (!Door.cachedModel) {
                // Si un chargement est déjà en cours, on attend
                if (Door.loadingPromise) {
                    await Door.loadingPromise;
                } else {
                    // On lance le chargement
                    Door.loadingPromise = this.loadModelFromFile();
                    await Door.loadingPromise;
                    Door.loadingPromise = null;
                }
            }

            // Clone le modèle depuis le cache
            if (Door.cachedModel) {
                this.doorModel = Door.cachedModel.clone();
                this.animations = Door.cachedAnimations;

                // Applique l'échelle
                this.doorModel.scale.set(
                    Door.MODEL_SCALE,
                    Door.MODEL_SCALE,
                    Door.MODEL_SCALE,
                );

                // Applique la couleur si définie
                if (Door.MODEL_COLOR) {
                    const color = new THREE.Color(Door.MODEL_COLOR);
                    this.doorModel.traverse((child) => {
                        if (child instanceof THREE.Mesh) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach((mat) => {
                                    if (
                                        mat instanceof
                                        THREE.MeshStandardMaterial
                                    ) {
                                        mat.color.copy(color);
                                    }
                                });
                            } else if (
                                child.material instanceof
                                THREE.MeshStandardMaterial
                            ) {
                                child.material.color.copy(color);
                            }
                        }
                    });
                }

                // Calcule les dimensions du modèle pour positionner le texte
                const box = new THREE.Box3().setFromObject(this.doorModel);
                const center = box.getCenter(new THREE.Vector3());
                this.modelHeight = box.max.y - box.min.y;

                // Centre le modèle
                this.doorModel.position.set(-center.x, -box.min.y, -center.z);

                this.group.add(this.doorModel);

                // Configure l'animation si elle existe
                if (this.animations.length > 0 && this.animations[0]) {
                    this.mixer = new THREE.AnimationMixer(this.doorModel);

                    // Trouve l'animation d'ouverture (première animation du modèle)
                    const openClip = this.animations[0];
                    this.openAction = this.mixer.clipAction(openClip);
                    this.openAction.setLoop(THREE.LoopOnce, 1);
                    this.openAction.clampWhenFinished = true;
                }
            }
        } catch (error) {
            console.error(
                "[Door] Erreur lors du chargement du modèle GLTF:",
                error,
            );
        }
    }

    /**
     * Charge le modèle depuis le fichier et le met en cache
     */
    private async loadModelFromFile(): Promise<void> {
        console.log(`[Door] Chargement du modèle "${Door.MODEL_PATH}"...`);

        const gltf = await Door.loader.loadAsync(Door.MODEL_PATH);

        Door.cachedModel = gltf.scene;
        Door.cachedAnimations = gltf.animations;

        // Configure les matériaux pour utiliser les lumières de la scène
        Door.cachedModel.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach((mat) => {
                            if (mat instanceof THREE.MeshStandardMaterial) {
                                mat.needsUpdate = true;
                            }
                        });
                    } else if (
                        child.material instanceof THREE.MeshStandardMaterial
                    ) {
                        child.material.needsUpdate = true;
                    }
                }
            }
        });

        console.log(
            `[Door] Modèle chargé avec succès (${Door.cachedAnimations.length} animation(s))`,
        );
    }

    /**
     * Crée le texte au-dessus de la porte
     */
    private createText(title: string, subtitle: string): void {
        // Crée l'élément HTML
        const labelDiv = document.createElement("div");
        labelDiv.className = "door-label";
        labelDiv.innerHTML = `
            <div class="door-title">${title}</div>
            <div class="door-subtitle">${subtitle}</div>
        `;

        // Crée l'objet CSS2D
        const label = new CSS2DObject(labelDiv);
        label.position.set(0, this.modelHeight + 0.5, 0);
        this.group.add(label);
    }

    /**
     * Met en surbrillance la porte (quand le joueur est proche)
     */
    public highlight(enabled: boolean): void {
        if (this.isHighlighted === enabled || !this.doorModel) return;

        this.isHighlighted = enabled;

        // Applique l'effet de surbrillance à tous les matériaux de la porte
        this.doorModel.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                if (Array.isArray(child.material)) {
                    child.material.forEach((mat) => {
                        if (mat instanceof THREE.MeshStandardMaterial) {
                            mat.emissive = new THREE.Color(
                                enabled ? "#333333" : "#000000",
                            );
                        }
                    });
                } else if (
                    child.material instanceof THREE.MeshStandardMaterial
                ) {
                    child.material.emissive = new THREE.Color(
                        enabled ? "#333333" : "#000000",
                    );
                }
            }
        });
    }

    /**
     * Retourne l'ID de la porte
     */
    public getId(): string {
        return this.id;
    }

    /**
     * Retourne le groupe 3D
     */
    public getObject(): THREE.Group {
        return this.group;
    }

    /**
     * Retourne la position de la porte
     */
    public getPosition(): THREE.Vector3 {
        return this.group.position.clone();
    }

    /**
     * Vérifie si un point est proche de la porte
     */
    public isNear(position: THREE.Vector3, threshold: number = 2): boolean {
        const doorPos = this.group.position.clone();
        doorPos.y = position.y; // Ignore la hauteur
        return position.distanceTo(doorPos) < threshold;
    }

    /**
     * Ouvre ou ferme la porte (joue l'animation)
     */
    public setOpen(open: boolean): void {
        if (this.isOpen === open || !this.openAction) return;
        this.isOpen = open;

        if (open) {
            // Ouvrir : joue l'animation vers l'avant
            this.openAction.reset();
            this.openAction.timeScale = Door.ANIMATION_SPEED;
            this.openAction.play();
        } else {
            // Fermer : joue l'animation vers l'arrière
            this.openAction.paused = false;
            this.openAction.timeScale = -Door.ANIMATION_SPEED;
            this.openAction.play();
        }
    }

    /**
     * Ouvre la porte et attend que l'animation se termine
     * @returns Promise qui se résout quand l'animation est terminée
     */
    public async openAndWait(): Promise<void> {
        if (
            this.isOpen ||
            this.isAnimating ||
            !this.openAction ||
            !this.mixer
        ) {
            return Promise.resolve();
        }

        this.isOpen = true;
        this.isAnimating = true;

        return new Promise<void>((resolve) => {
            if (!this.openAction || !this.mixer) {
                this.isAnimating = false;
                resolve();
                return;
            }

            // Écoute l'événement de fin d'animation
            const onFinished = () => {
                this.mixer!.removeEventListener("finished", onFinished);
                this.isAnimating = false;
                resolve();
            };

            this.mixer.addEventListener("finished", onFinished);

            // Lance l'animation
            this.openAction.reset();
            this.openAction.timeScale = Door.ANIMATION_SPEED;
            this.openAction.play();
        });
    }

    /**
     * Vérifie si la porte est ouverte
     */
    public getIsOpen(): boolean {
        return this.isOpen;
    }

    /**
     * Vérifie si la porte est en cours d'animation
     */
    public getIsAnimating(): boolean {
        return this.isAnimating;
    }

    /**
     * Met à jour l'AnimationMixer (doit être appelé à chaque frame)
     */
    public update(delta: number): void {
        if (this.mixer) {
            this.mixer.update(delta);
        }
    }
}
