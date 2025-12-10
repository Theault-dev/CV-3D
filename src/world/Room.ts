import * as THREE from "three";

/**
 * Configuration d'une pièce
 */
export interface RoomConfig {
    /** Largeur de la pièce */
    width: number;
    /** Profondeur de la pièce */
    depth: number;
    /** Hauteur des murs */
    height?: number;
    /** Position du centre de la pièce */
    position?: THREE.Vector3;
    /** Couleur du sol */
    floorColor?: string;
    /** Couleur des murs */
    wallColor?: string;
}

/**
 * Room - Une pièce avec sol et murs
 */
export class Room {
    private group: THREE.Group;
    private config: Required<RoomConfig>;

    constructor(config: RoomConfig) {
        this.config = {
            width: config.width,
            depth: config.depth,
            height: config.height ?? 4,
            position: config.position ?? new THREE.Vector3(0, 0, 0),
            floorColor: config.floorColor ?? "#2a2a3a",
            wallColor: config.wallColor ?? "#3a3a4a",
        };

        this.group = new THREE.Group();
        this.group.position.copy(this.config.position);

        this.createFloor();
        this.createWalls();
    }

    /**
     * Crée le sol
     */
    private createFloor(): void {
        const geometry = new THREE.PlaneGeometry(
            this.config.width,
            this.config.depth,
        );
        const material = new THREE.MeshStandardMaterial({
            color: this.config.floorColor,
            roughness: 0.9,
        });
        const floor = new THREE.Mesh(geometry, material);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.group.add(floor);
    }

    /**
     * Crée les 4 murs
     */
    private createWalls(): void {
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: this.config.wallColor,
            roughness: 0.8,
            side: THREE.DoubleSide,
        });

        // Mur du fond (Z négatif)
        const backWall = new THREE.Mesh(
            new THREE.PlaneGeometry(this.config.width, this.config.height),
            wallMaterial,
        );
        backWall.position.set(
            0,
            this.config.height / 2,
            -this.config.depth / 2,
        );
        this.group.add(backWall);

        // Mur de devant (Z positif) - avec une ouverture pour entrer
        // On ne le crée pas pour le hall principal

        // Mur gauche (X négatif)
        const leftWall = new THREE.Mesh(
            new THREE.PlaneGeometry(this.config.depth, this.config.height),
            wallMaterial,
        );
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.set(
            -this.config.width / 2,
            this.config.height / 2,
            0,
        );
        this.group.add(leftWall);

        // Mur droit (X positif)
        const rightWall = new THREE.Mesh(
            new THREE.PlaneGeometry(this.config.depth, this.config.height),
            wallMaterial,
        );
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.set(
            this.config.width / 2,
            this.config.height / 2,
            0,
        );
        this.group.add(rightWall);
    }

    /**
     * Ajoute un objet à la pièce
     */
    public add(object: THREE.Object3D): void {
        this.group.add(object);
    }

    /**
     * Retourne le groupe 3D
     */
    public getObject(): THREE.Group {
        return this.group;
    }

    /**
     * Retourne les dimensions
     */
    public getDimensions(): { width: number; depth: number; height: number } {
        return {
            width: this.config.width,
            depth: this.config.depth,
            height: this.config.height,
        };
    }
}
