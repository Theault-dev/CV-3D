import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { Engine } from "../core/Engine";
import { Player } from "../player/Player";
import { PeriodRoom } from "./PeriodRoom";
import type { Periode } from "../data/types";

/**
 * État actuel du système de salles
 */
export interface RoomState {
    currentRoom: "hall" | "period";
    activePeriodRoom: PeriodRoom | null;
    visitedDoorIds: Set<string>;
}

/**
 * RoomManager - Gestion des transitions entre le hall et les salles de période
 */
export class RoomManager {
    private engine: Engine;
    private hallGroup: THREE.Group;
    private state: RoomState;
    private player: Player;
    private isTransitioning: boolean = false;

    constructor(engine: Engine, hallGroup: THREE.Group, player: Player) {
        this.engine = engine;
        this.hallGroup = hallGroup;
        this.player = player;

        this.state = {
            currentRoom: "hall",
            activePeriodRoom: null,
            visitedDoorIds: new Set(),
        };
    }

    /**
     * Entre dans une salle de période
     */
    public async enterPeriodRoom(periode: Periode): Promise<void> {
        if (this.isTransitioning) return;
        this.isTransitioning = true;

        try {
            // 1. Créer la PeriodRoom
            const periodRoom = new PeriodRoom({ periode });
            this.state.activePeriodRoom = periodRoom;

            // 2. Ajouter au scene
            this.engine.add(periodRoom.getObject());

            // 3. Cacher le hall
            this.hallGroup.visible = false;

            // 4. Téléporter le joueur à l'entrée
            this.player.setPosition(periodRoom.getEntryPosition());

            // 5. Marquer comme visitée
            this.state.visitedDoorIds.add(periode.id);

            // 6. Changer l'état
            this.state.currentRoom = "period";
        } finally {
            this.isTransitioning = false;
        }
    }

    /**
     * Retourne au hall
     */
    public exitToHall(): void {
        if (!this.state.activePeriodRoom) return;

        // 1. Retirer la salle de la scène
        this.engine.remove(this.state.activePeriodRoom.getObject());

        // 2. Cleanup mémoire (dispose geometries/materials)
        this.disposeRoom(this.state.activePeriodRoom);

        // 3. Réinitialiser
        this.state.activePeriodRoom = null;

        // 4. Afficher le hall
        this.hallGroup.visible = true;

        // 5. Téléporter à la position d'origine
        this.player.setPosition(new THREE.Vector3(0, 0, 5));

        // 6. Changer l'état
        this.state.currentRoom = "hall";
    }

    /**
     * Dispose des ressources Three.js d'une salle
     */
    private disposeRoom(room: PeriodRoom): void {
        const roomObject = room.getObject();

        roomObject.traverse((child) => {
            // Nettoyer les labels CSS2D
            if (child instanceof CSS2DObject) {
                if (child.element && child.element.parentNode) {
                    child.element.parentNode.removeChild(child.element);
                }
            }

            // Nettoyer les mesh
            if (child instanceof THREE.Mesh) {
                if (child.geometry) {
                    child.geometry.dispose();
                }

                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach((m) => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            }
        });

        // Nettoyer tous les enfants du groupe
        while (roomObject.children.length > 0) {
            const child = roomObject.children[0];
            if (child) {
                roomObject.remove(child);
            }
        }
    }

    /**
     * Vérifie si on est dans le hall
     */
    public isInHall(): boolean {
        return this.state.currentRoom === "hall";
    }

    /**
     * Vérifie si on est dans une salle de période
     */
    public isInPeriodRoom(): boolean {
        return this.state.currentRoom === "period";
    }

    /**
     * Retourne la salle de période active
     */
    public getActivePeriodRoom(): PeriodRoom | null {
        return this.state.activePeriodRoom;
    }

    /**
     * Vérifie si une porte a été visitée
     */
    public isDoorVisited(doorId: string): boolean {
        return this.state.visitedDoorIds.has(doorId);
    }

    /**
     * Marque une porte comme visitée
     */
    public markDoorAsVisited(doorId: string): void {
        this.state.visitedDoorIds.add(doorId);
    }
}
