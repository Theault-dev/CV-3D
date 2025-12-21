import * as THREE from "three";
import { FBXLoader } from "three-stdlib";
import { InputManager } from "../core/InputManager";

/**
 * Configuration du joueur
 */
interface PlayerConfig {
    startPosition?: THREE.Vector3;
    moveSpeed?: number;
    /** Vitesse à laquelle la caméra se replace derrière le joueur */
    cameraFollowSpeed?: number;
    /** Vitesse à laquelle le personnage tourne vers sa direction */
    turnSpeed?: number;
}

/**
 * Player - Le personnage jouable avec caméra TPS moderne
 */
export class Player {
    private group: THREE.Group;
    private avatar: THREE.Object3D;
    private input: InputManager;
    private camera: THREE.PerspectiveCamera;

    // Configuration
    private moveSpeed: number;
    private cameraFollowSpeed: number;
    private turnSpeed: number;

    // Paramètres de la caméra
    private cameraDistance = 5;
    private cameraHeight = 3;
    private cameraAngle = 0; // Angle horizontal de la caméra autour du joueur

    // Direction vers laquelle le personnage fait face (en radians)
    private characterFacing = 0;

    // Vélocité pour le lissage
    private velocity = new THREE.Vector3();

    // Fonction de vérification de collision (optionnelle)
    private collisionChecker: ((position: THREE.Vector3) => boolean) | null =
        null;

    constructor(
        camera: THREE.PerspectiveCamera,
        input: InputManager,
        config: PlayerConfig = {},
    ) {
        this.camera = camera;
        this.input = input;

        this.moveSpeed = config.moveSpeed ?? 5;
        this.cameraFollowSpeed = config.cameraFollowSpeed ?? 2;
        this.turnSpeed = config.turnSpeed ?? 10;

        this.group = new THREE.Group();

        const startPos = config.startPosition ?? new THREE.Vector3(0, 0, 0);
        this.group.position.copy(startPos);

        // Crée un avatar temporaire pendant le chargement
        this.avatar = this.createTempAvatar();
        this.group.add(this.avatar);

        // Charge le modèle FBX de manière asynchrone
        this.loadFBXModel();

        this.updateCamera(0, true); // Force la position initiale
    }

    private createTempAvatar(): THREE.Object3D {
        const avatarGroup = new THREE.Group();

        // Corps
        const bodyGeometry = new THREE.BoxGeometry(0.6, 1.5, 0.4);
        const bodyMaterial = new THREE.MeshStandardMaterial({
            color: "#4a90d9",
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.position.y = 0.75;
        avatarGroup.add(body);

        // Tête
        const headGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.4);
        const headMaterial = new THREE.MeshStandardMaterial({
            color: "#ffcc99",
        });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.7;
        avatarGroup.add(head);

        // Nez (indicateur de direction)
        const noseGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.2);
        const noseMaterial = new THREE.MeshStandardMaterial({
            color: "#ff6666",
        });
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.position.set(0, 1.7, -0.25);
        avatarGroup.add(nose);

        return avatarGroup;
    }

    private async loadFBXModel(): Promise<void> {
        const loader = new FBXLoader();

        try {
            const fbx = await loader.loadAsync("/models/character.fbx");

            // Ajuste la taille du modèle si nécessaire
            // La plupart des modèles FBX ont besoin d'être mis à l'échelle
            fbx.scale.set(0.02, 0.02, 0.02);

            // Calcule la position avant toute rotation
            const box = new THREE.Box3().setFromObject(fbx);
            const center = box.getCenter(new THREE.Vector3());

            // Positionne le modèle : centré en X/Z, avec les pieds au niveau du sol
            fbx.position.set(-center.x, -box.min.y, -center.z);

            // Configure les matériaux pour utiliser les lumières de la scène
            fbx.traverse((child) => {
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

            // Crée un groupe pour contenir le modèle avec sa correction d'orientation
            // Le FBX est placé dans un groupe enfant avec une rotation fixe de 180°
            // tandis que le groupe parent (this.avatar) sera tourné par le système de contrôle
            const avatarGroup = new THREE.Group();
            fbx.rotation.y = Math.PI; // Correction fixe de l'orientation du modèle
            avatarGroup.add(fbx);

            // Remplace l'avatar temporaire par le nouveau groupe
            this.group.remove(this.avatar);
            this.avatar = avatarGroup;
            this.group.add(this.avatar);

            console.log("Modèle FBX chargé avec succès");
        } catch (error) {
            console.error("Erreur lors du chargement du modèle FBX:", error);
            console.log("Utilisation de l'avatar temporaire par défaut");
        }
    }

    public update(delta: number): void {
        const movement = this.input.getMovement();
        const isMoving = this.input.isMoving();

        if (isMoving) {
            // Calcule la direction de déplacement relative à la caméra
            const moveDirection = new THREE.Vector3();

            // Direction avant/arrière (Z/S) - basée sur l'angle de la caméra
            moveDirection.x += Math.sin(this.cameraAngle) * movement.z;
            moveDirection.z += Math.cos(this.cameraAngle) * movement.z;

            // Direction gauche/droite (Q/D) - perpendiculaire à la caméra
            moveDirection.x +=
                Math.sin(this.cameraAngle + Math.PI / 2) * movement.x;
            moveDirection.z +=
                Math.cos(this.cameraAngle + Math.PI / 2) * movement.x;

            // Normalise et applique la vitesse
            if (moveDirection.length() > 0) {
                moveDirection.normalize();
                this.velocity
                    .copy(moveDirection)
                    .multiplyScalar(this.moveSpeed);

                // Calcule la nouvelle position
                const newPosition = this.group.position
                    .clone()
                    .addScaledVector(this.velocity, delta);

                // Vérifie la collision si un checker est défini
                if (
                    !this.collisionChecker ||
                    !this.collisionChecker(newPosition)
                ) {
                    // Pas de collision, déplace le joueur
                    this.group.position.copy(newPosition);
                }
                // Si collision, le joueur reste à sa position actuelle

                // Calcule l'angle vers lequel le personnage doit tourner
                let targetFacing: number;

                if (movement.z > 0 && movement.x === 0) {
                    // Recule pur (S seul) : fait face à la caméra exactement
                    targetFacing = this.cameraAngle + Math.PI;
                } else {
                    // Autres mouvements : fait face à la direction du mouvement
                    targetFacing = Math.atan2(
                        -moveDirection.x,
                        -moveDirection.z,
                    );
                }

                // Tourne progressivement le personnage vers sa direction de mouvement
                this.characterFacing = this.lerpAngle(
                    this.characterFacing,
                    targetFacing,
                    this.turnSpeed * delta,
                );
                this.avatar.rotation.y = this.characterFacing;

                // La caméra se replace doucement derrière le personnage
                if (movement.z < 0) {
                    // Avance : vitesse normale
                    this.cameraAngle = this.lerpAngle(
                        this.cameraAngle,
                        this.characterFacing,
                        this.cameraFollowSpeed * delta,
                    );
                } else if (movement.x !== 0) {
                    // Strafe ou recule+tourne : vitesse réduite
                    this.cameraAngle = this.lerpAngle(
                        this.cameraAngle,
                        this.characterFacing,
                        this.cameraFollowSpeed * 0.6 * delta,
                    );
                }
            }
        }

        this.updateCamera(delta, false);
    }

    /**
     * Interpole entre deux angles (gère le wraparound -π à π)
     */
    private lerpAngle(from: number, to: number, t: number): number {
        // Normalise les angles entre -π et π
        let diff = to - from;

        // Gère le wraparound
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;

        return from + diff * Math.min(t, 1);
    }

    private updateCamera(delta: number, immediate: boolean): void {
        // Position de la caméra basée sur son angle autour du joueur
        const cameraX =
            this.group.position.x +
            Math.sin(this.cameraAngle) * this.cameraDistance;
        const cameraZ =
            this.group.position.z +
            Math.cos(this.cameraAngle) * this.cameraDistance;
        const cameraY = this.group.position.y + this.cameraHeight;

        if (immediate) {
            this.camera.position.set(cameraX, cameraY, cameraZ);
        } else {
            // Lissage de la position de la caméra
            this.camera.position.lerp(
                new THREE.Vector3(cameraX, cameraY, cameraZ),
                5 * delta,
            );
        }

        // La caméra regarde le personnage (légèrement au-dessus du sol)
        const lookTarget = new THREE.Vector3(
            this.group.position.x,
            this.group.position.y + 1.2,
            this.group.position.z,
        );
        this.camera.lookAt(lookTarget);
    }

    public getObject(): THREE.Group {
        return this.group;
    }

    public getPosition(): THREE.Vector3 {
        return this.group.position.clone();
    }

    public setPosition(position: THREE.Vector3, rotation?: number): void {
        this.group.position.copy(position);

        if (rotation !== undefined) {
            this.characterFacing = rotation;
            this.cameraAngle = rotation;
            this.avatar.rotation.y = rotation;
        }

        this.updateCamera(0, true);
    }

    public getRotation(): number {
        return this.characterFacing;
    }

    /**
     * Définit la fonction de vérification de collision
     * @param checker - Fonction qui prend une position et retourne true si collision
     */
    public setCollisionChecker(
        checker: ((position: THREE.Vector3) => boolean) | null,
    ): void {
        this.collisionChecker = checker;
    }
}
