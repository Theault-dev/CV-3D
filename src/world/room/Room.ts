import * as THREE from "three";
import { FloorBuilder, WallBuilder } from "../builders";
import type { RoomConfig, ResolvedRoomConfig } from "./types";
import {
    DEFAULT_WALL_HEIGHT,
    DEFAULT_FLOOR_COLOR,
    DEFAULT_WALL_COLOR,
    DEFAULT_DOOR_WIDTH,
    DEFAULT_DOOR_HEIGHT_RATIO,
} from "./constants";

/**
 * Room - Une pièce avec sol et murs
 *
 * Utilise FloorBuilder et WallBuilder pour la construction.
 */
export class Room {
    private group: THREE.Group;
    private config: ResolvedRoomConfig;
    private floorBuilder: FloorBuilder;
    private wallBuilder: WallBuilder;

    constructor(config: RoomConfig) {
        this.config = this.resolveConfig(config);

        this.group = new THREE.Group();
        this.group.position.copy(this.config.position);

        // Création du sol
        this.floorBuilder = new FloorBuilder({
            width: this.config.width,
            depth: this.config.depth,
            color: this.config.floorColor,
        });
        this.group.add(this.floorBuilder.getMesh());

        // Création des murs
        this.wallBuilder = new WallBuilder({
            width: this.config.width,
            depth: this.config.depth,
            height: this.config.height,
            wallColor: this.config.wallColor,
            doorPositions: this.config.doorPositions,
            doorWidth: this.config.doorWidth,
            doorHeightRatio: this.config.doorHeightRatio,
        });

        // Ajout des murs temporaires
        const tempWalls = this.wallBuilder.createTempWalls();
        tempWalls.forEach((wall) => this.group.add(wall));

        // Chargement async des modèles
        this.loadWallModels();
    }

    /**
     * Résout la configuration avec les valeurs par défaut
     */
    private resolveConfig(config: RoomConfig): ResolvedRoomConfig {
        return {
            width: config.width,
            depth: config.depth,
            height: config.height ?? DEFAULT_WALL_HEIGHT,
            position: config.position ?? new THREE.Vector3(0, 0, 0),
            floorColor: config.floorColor ?? DEFAULT_FLOOR_COLOR,
            wallColor: config.wallColor ?? DEFAULT_WALL_COLOR,
            doorPositions: config.doorPositions ?? [],
            doorWidth: config.doorWidth ?? DEFAULT_DOOR_WIDTH,
            doorHeightRatio:
                config.doorHeightRatio ?? DEFAULT_DOOR_HEIGHT_RATIO,
        };
    }

    /**
     * Charge les modèles de murs GLB et remplace les murs temporaires
     */
    private async loadWallModels(): Promise<void> {
        try {
            const result = await this.wallBuilder.loadAndCreateWalls();

            // Mise à jour du sol
            this.floorBuilder.resize(result.actualWidth, result.actualDepth);
            console.log(
                `[Room] Sol redimensionné : ${result.actualWidth.toFixed(2)}x${result.actualDepth.toFixed(2)}`,
            );

            // Ajout des segments de murs
            result.segments.forEach((segment) => this.group.add(segment));

            // Repositionnement
            WallBuilder.repositionSegments(
                result.segments,
                result.actualWidth,
                result.actualDepth,
                result.offsets,
            );

            // Suppression des murs temporaires
            const tempWalls = this.wallBuilder.getTempWalls();
            tempWalls.forEach((wall) => this.group.remove(wall));
            this.wallBuilder.disposeTempWalls();

            console.log(
                `[Room] ${tempWalls.length} murs temporaires supprimés`,
            );
            console.log("[Room] Murs GLB positionnés avec succès");
        } catch (error) {
            console.warn(
                "[Room] Impossible de charger les modèles de murs:",
                error,
            );
        }
    }

    // ==================== API PUBLIQUE ====================

    /**
     * Ajoute un objet 3D à la pièce
     */
    public add(object: THREE.Object3D): void {
        this.group.add(object);
    }

    /**
     * Retourne le groupe THREE.js de la pièce
     */
    public getObject(): THREE.Group {
        return this.group;
    }

    /**
     * Retourne les dimensions de la pièce
     */
    public getDimensions(): { width: number; depth: number; height: number } {
        return {
            width: this.config.width,
            depth: this.config.depth,
            height: this.config.height,
        };
    }

    /**
     * Vérifie si une position entre en collision avec les murs
     */
    public checkCollision(
        position: THREE.Vector3,
        playerRadius: number = 0.5,
    ): boolean {
        const halfWidth = this.config.width / 2 - playerRadius;
        const halfDepth = this.config.depth / 2 - playerRadius;

        return (
            Math.abs(position.x) > halfWidth || Math.abs(position.z) > halfDepth
        );
    }

    /**
     * Libère les ressources
     */
    public dispose(): void {
        this.floorBuilder.dispose();
        // Note: Les segments de murs sont gérés par le groupe THREE.js
    }
}
