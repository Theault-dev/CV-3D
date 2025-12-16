import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import type { Projet } from "../data/types";

/**
 * Configuration d'un cube de projet
 */
export interface ProjectCubeConfig {
    projet: Projet;
    position: THREE.Vector3;
    color: string;
}

/**
 * ProjectCube - Cube 3D interactif représentant un projet
 */
export class ProjectCube {
    private group: THREE.Group;
    private projet: Projet;
    private mesh: THREE.Mesh;
    private material: THREE.MeshStandardMaterial;
    private isHighlighted: boolean = false;

    constructor(config: ProjectCubeConfig) {
        this.projet = config.projet;
        this.group = new THREE.Group();

        // Créer le cube
        const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.8);
        this.material = new THREE.MeshStandardMaterial({
            color: config.color,
            roughness: 0.6,
        });

        this.mesh = new THREE.Mesh(geometry, this.material);
        this.mesh.position.y = 0.4; // Posé au sol
        this.group.add(this.mesh);

        // Label CSS2D avec nom du projet
        const labelDiv = document.createElement("div");
        labelDiv.className = "project-cube-label";
        labelDiv.textContent = config.projet.nom;

        const label = new CSS2DObject(labelDiv);
        label.position.set(0, 1, 0); // Au-dessus du cube
        this.group.add(label);

        // Position du cube
        this.group.position.copy(config.position);
    }

    /**
     * Vérifie si un point est proche du cube
     */
    public isNear(position: THREE.Vector3, threshold: number = 1.5): boolean {
        const cubePos = this.group.position.clone();
        cubePos.y = position.y; // Ignore la hauteur
        return position.distanceTo(cubePos) < threshold;
    }

    /**
     * Met en surbrillance le cube (quand le joueur est proche)
     */
    public highlight(enabled: boolean): void {
        if (this.isHighlighted === enabled) return;

        this.isHighlighted = enabled;
        this.material.emissive = new THREE.Color(
            enabled ? "#333333" : "#000000",
        );
    }

    /**
     * Retourne les données du projet
     */
    public getProjet(): Projet {
        return this.projet;
    }

    /**
     * Retourne le groupe 3D
     */
    public getObject(): THREE.Group {
        return this.group;
    }

    /**
     * Retourne la position du cube
     */
    public getPosition(): THREE.Vector3 {
        return this.group.position.clone();
    }
}
