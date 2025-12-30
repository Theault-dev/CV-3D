import * as THREE from "three";
import { ModelLoader } from "../services/ModelLoader";

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
        this.loadWallModels(); // Charge les modèles FBX en arrière-plan
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
        floor.name = "floor";
        this.group.add(floor);
    }

    /**
     * Met à jour les dimensions du sol pour correspondre aux murs FBX
     */
    private updateFloorSize(width: number, depth: number): void {
        const floor = this.group.children.find(
            (child) => child.name === "floor",
        ) as THREE.Mesh | undefined;

        if (floor && floor.geometry) {
            // Supprime l'ancienne géométrie
            floor.geometry.dispose();

            // Crée une nouvelle géométrie avec les dimensions ajustées
            floor.geometry = new THREE.PlaneGeometry(width, depth);

            console.log(
                `[Room] Sol redimensionné : ${width.toFixed(2)}x${depth.toFixed(2)}`,
            );
        }
    }

    /**
     * Repositionne les murs FBX selon les dimensions réelles
     */
    private repositionWalls(
        width: number,
        depth: number,
        offsets: {
            back: { x: number; y: number; z: number };
            left: { x: number; y: number; z: number };
            right: { x: number; y: number; z: number };
        },
    ): void {
        this.group.children.forEach((child) => {
            if (child.name.startsWith("fbxWall_")) {
                const parts = child.name.split("_");
                const side = parts[1] as "back" | "left" | "right";

                if (side === "back") {
                    // Mur du fond : ajuste la position Z + offset
                    child.position.z = -depth / 2 + offsets.back.z;
                    child.position.x = child.position.x + offsets.back.x;
                    child.position.y = offsets.back.y;
                } else if (side === "left") {
                    // Mur gauche : ajuste la position X + offset
                    child.position.x = -width / 2 + offsets.left.x;
                    child.position.z = child.position.z + offsets.left.z;
                    child.position.y = offsets.left.y;
                } else if (side === "right") {
                    // Mur droit : ajuste la position X + offset
                    child.position.x = width / 2 + offsets.right.x;
                    child.position.z = child.position.z + offsets.right.z;
                    child.position.y = offsets.right.y;
                }
            }
        });

        console.log(
            `[Room] Murs repositionnés : width=${width.toFixed(2)}, depth=${depth.toFixed(2)}`,
        );
    }

    /**
     * Crée les 4 murs (temporaires, seront remplacés par les modèles FBX)
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
        backWall.name = "tempWall_back";
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
        leftWall.name = "tempWall_left";
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
        rightWall.name = "tempWall_right";
        this.group.add(rightWall);
    }

    /**
     * Charge les modèles FBX des murs et remplace les murs temporaires
     */
    private async loadWallModels(): Promise<void> {
        try {
            // ==================== CONFIGURATION DU MODÈLE ====================
            const wallModelPath = "/models/walls/Wall_Empty.fbx";
            const wallScale = 0.01;
            const wallOverlap = 1 / 3; // Chevauchement entre segments

            const wallOffset = 0.2; // Décalage pour éviter les trous dans les coins

            // Ajustements de position (décalages en unités Three.js)
            const wallOffsets = {
                back: { x: 0, y: 0, z: wallOffset }, // Mur du fond
                left: { x: wallOffset, y: 0, z: 0 }, // Mur gauche
                right: { x: -wallOffset, y: 0, z: 0 }, // Mur droit
            };
            // =================================================================

            // Charge le modèle de mur
            const wallModel = await ModelLoader.loadFBX(
                wallModelPath,
                wallScale,
            );

            // Mesure les dimensions du modèle
            const box = new THREE.Box3().setFromObject(wallModel);
            const size = box.getSize(new THREE.Vector3());
            const wallWidth = size.x; // Largeur d'un mur (4.00)

            console.log(
                `[Room] Modèle de mur : ${wallWidth.toFixed(2)}x${size.y.toFixed(2)}x${size.z.toFixed(2)}`,
            );

            // Crée les murs du fond (le long de l'axe X)
            const actualWidth = this.createWallSegments(
                wallModel,
                wallWidth,
                this.config.width,
                0,
                -this.config.depth / 2,
                Math.PI, // 180° pour que le mur regarde vers l'intérieur
                "back",
                wallOverlap,
            );

            // Crée les murs gauche (le long de l'axe Z)
            const actualDepthLeft = this.createWallSegments(
                wallModel,
                wallWidth,
                this.config.depth,
                -this.config.width / 2,
                0,
                -Math.PI / 2, // -90° pour que le mur regarde vers l'intérieur
                "left",
                wallOverlap,
            );

            // Crée les murs droit (le long de l'axe Z)
            const actualDepthRight = this.createWallSegments(
                wallModel,
                wallWidth,
                this.config.depth,
                this.config.width / 2,
                0,
                Math.PI / 2, // +90° pour que le mur regarde vers l'intérieur
                "right",
                wallOverlap,
            );

            // Met à jour le sol avec les dimensions réelles des murs
            const actualDepth = Math.max(actualDepthLeft, actualDepthRight);
            this.updateFloorSize(actualWidth, actualDepth);

            // Repositionne les murs FBX selon les dimensions réelles
            this.repositionWalls(actualWidth, actualDepth, wallOffsets);

            // Supprime les murs temporaires
            this.removeTempWalls();

            console.log("[Room] Murs FBX positionnés avec succès");
        } catch (error) {
            console.warn(
                "[Room] Impossible de charger les modèles de murs, utilisation des murs temporaires:",
                error,
            );
        }
    }

    /**
     * Crée plusieurs segments de mur pour couvrir une distance donnée
     * @returns La longueur réelle couverte par les murs
     */
    private createWallSegments(
        wallModel: THREE.Group,
        wallWidth: number,
        totalLength: number,
        x: number,
        z: number,
        rotationY: number,
        side: string,
        overlap: number,
    ): number {
        const effectiveWidth = wallWidth - overlap;

        // Calcule le nombre de murs nécessaires pour couvrir totalLength
        const numWalls = Math.ceil(totalLength / effectiveWidth);

        // Longueur réelle couverte par les murs
        const actualLength = (numWalls - 1) * effectiveWidth + wallWidth;

        // Centre les murs dans la zone disponible
        const startOffset = -(actualLength / 2) + wallWidth / 2;

        for (let i = 0; i < numWalls; i++) {
            // Clone le modèle au lieu de le recharger
            const wall = wallModel.clone();

            // Calcule la position du segment avec chevauchement
            const offset = startOffset + i * effectiveWidth;

            // Position selon l'orientation
            if (Math.abs(rotationY) === Math.PI || rotationY === 0) {
                // Mur du fond (rotation 0° ou 180°) : position le long de X
                wall.position.set(x + offset, 0, z);
            } else {
                // Murs latéraux (rotation ±90°) : position le long de Z
                wall.position.set(x, 0, z + offset);
            }

            wall.rotation.y = rotationY;
            wall.name = `fbxWall_${side}_${i}`;
            this.group.add(wall);
        }

        console.log(`[Room] ${numWalls} segments de mur ajoutés (${side})`);
        return actualLength;
    }

    /**
     * Supprime les murs temporaires
     */
    private removeTempWalls(): void {
        const tempWalls = this.group.children.filter((child) =>
            child.name.startsWith("tempWall_"),
        );
        tempWalls.forEach((wall) => this.group.remove(wall));
        console.log(`[Room] ${tempWalls.length} murs temporaires supprimés`);
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

    /**
     * Vérifie si une position entre en collision avec les murs de la salle
     * @param position - Position à tester
     * @param playerRadius - Rayon du joueur (défaut: 0.5)
     * @returns true si collision, false sinon
     */
    public checkCollision(
        position: THREE.Vector3,
        playerRadius: number = 0.5,
    ): boolean {
        // Limites de la salle avec marge pour le rayon du joueur
        const minX = -this.config.width / 2 + playerRadius;
        const maxX = this.config.width / 2 - playerRadius;
        const minZ = -this.config.depth / 2 + playerRadius;
        const maxZ = this.config.depth / 2 - playerRadius;

        // Vérifie si la position est hors limites
        return (
            position.x < minX ||
            position.x > maxX ||
            position.z < minZ ||
            position.z > maxZ
        );
    }
}
