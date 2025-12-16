import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";

/**
 * Configuration du téléporteur
 */
export interface TeleporterConfig {
    position: THREE.Vector3;
}

/**
 * Teleporter - Plateforme de téléportation pour retourner au hall
 */
export class Teleporter {
    private group: THREE.Group;
    private platform: THREE.Mesh;

    constructor(config: TeleporterConfig) {
        this.group = new THREE.Group();

        // Créer la plateforme circulaire
        const platformGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.1, 32);
        const platformMaterial = new THREE.MeshStandardMaterial({
            color: "#4a90d9",
            emissive: "#4a90d9",
            emissiveIntensity: 0.3,
            roughness: 0.4,
            metalness: 0.6,
        });

        this.platform = new THREE.Mesh(platformGeometry, platformMaterial);
        this.platform.position.y = 0.05;
        this.group.add(this.platform);

        // Label CSS2D
        const labelDiv = document.createElement("div");
        labelDiv.className = "teleporter-label";
        labelDiv.textContent = "Retour au hall";

        const label = new CSS2DObject(labelDiv);
        label.position.set(0, 0.5, 0);
        this.group.add(label);

        // Position du téléporteur
        this.group.position.copy(config.position);
    }

    /**
     * Vérifie si un point est proche du téléporteur
     */
    public isNear(position: THREE.Vector3, threshold: number = 2): boolean {
        const teleporterPos = this.group.position.clone();
        teleporterPos.y = position.y; // Ignore la hauteur
        return position.distanceTo(teleporterPos) < threshold;
    }

    /**
     * Retourne le groupe 3D
     */
    public getObject(): THREE.Group {
        return this.group;
    }

    /**
     * Met à jour l'animation (rotation)
     */
    public update(delta: number): void {
        this.group.rotation.y += delta * 0.5;
    }
}
