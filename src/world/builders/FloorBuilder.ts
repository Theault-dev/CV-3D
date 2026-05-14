import * as THREE from "three";

export interface FloorConfig {
    width: number;
    depth: number;
    color: string;
}

/**
 * FloorBuilder - Création et mise à jour du sol d'une pièce
 */
export class FloorBuilder {
    private mesh: THREE.Mesh;

    constructor(config: FloorConfig) {
        const geometry = new THREE.PlaneGeometry(config.width, config.depth);
        const material = new THREE.MeshStandardMaterial({
            color: config.color,
            roughness: 0.9,
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.receiveShadow = true;
        this.mesh.name = "floor";
    }

    /**
     * Redimensionne le sol
     */
    public resize(width: number, depth: number): void {
        if (this.mesh.geometry) {
            this.mesh.geometry.dispose();
            this.mesh.geometry = new THREE.PlaneGeometry(width, depth);
        }
    }

    /**
     * Retourne le mesh du sol
     */
    public getMesh(): THREE.Mesh {
        return this.mesh;
    }

    /**
     * Libère les ressources
     */
    public dispose(): void {
        this.mesh.geometry.dispose();
        if (this.mesh.material instanceof THREE.Material) {
            this.mesh.material.dispose();
        }
    }
}
