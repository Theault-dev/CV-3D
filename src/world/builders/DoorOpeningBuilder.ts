import * as THREE from "three";
import {
    applyClippingPlanes,
    createHorizontalClipPlane,
    createVerticalClipPlaneX,
    createVerticalClipPlaneZ,
} from "../utils/clipping";
import type { DoorClipConfig } from "../room/types";
import { DOOR_OPENING_MARGIN } from "../room/constants";

/**
 * DoorOpeningBuilder - Création d'ouvertures de portes dans les murs
 *
 * Utilise des clipping planes pour découper le mur en 3 sections :
 * - Linteau (partie haute, au-dessus de la porte)
 * - Section gauche (à gauche de la porte, sous le linteau)
 * - Section droite (à droite de la porte, sous le linteau)
 */
export class DoorOpeningBuilder {
    /**
     * Crée un groupe contenant les 3 sections du mur avec l'ouverture
     */
    public static create(
        wallModel: THREE.Group,
        config: DoorClipConfig,
        segmentIndex: number,
    ): THREE.Group {
        const resultGroup = new THREE.Group();
        resultGroup.name = `fbxWall_${config.wallSide}_${segmentIndex}`;
        resultGroup.position.set(config.segmentX, 0, config.segmentZ);
        resultGroup.rotation.y = config.isBackWall
            ? 0
            : config.wallSide === "left"
              ? Math.PI / 2
              : -Math.PI / 2;

        const leftEdge =
            config.doorLocalPos - config.doorWidth / 2 - DOOR_OPENING_MARGIN;
        const rightEdge =
            config.doorLocalPos + config.doorWidth / 2 + DOOR_OPENING_MARGIN;

        // Création des 3 sections
        const lintel = this.createLintel(wallModel, config.doorHeight);
        const leftSection = this.createSideSection(
            wallModel,
            "left",
            leftEdge,
            config,
        );
        const rightSection = this.createSideSection(
            wallModel,
            "right",
            rightEdge,
            config,
        );

        resultGroup.add(lintel, leftSection, rightSection);

        return resultGroup;
    }

    /**
     * Crée le linteau (partie haute au-dessus de la porte)
     */
    private static createLintel(
        wallModel: THREE.Group,
        doorHeight: number,
    ): THREE.Group {
        const lintel = wallModel.clone();
        lintel.position.set(0, 0, 0);

        const clipPlane = createHorizontalClipPlane(doorHeight, true);
        applyClippingPlanes(lintel, [clipPlane]);

        return lintel;
    }

    /**
     * Crée une section latérale (gauche ou droite de la porte)
     */
    private static createSideSection(
        wallModel: THREE.Group,
        side: "left" | "right",
        edgePosition: number,
        config: DoorClipConfig,
    ): THREE.Group {
        const section = wallModel.clone();
        section.position.set(0, 0, 0);

        const clipPlanes = this.createSideClipPlanes(
            side,
            edgePosition,
            config,
        );
        applyClippingPlanes(section, clipPlanes);

        return section;
    }

    /**
     * Crée les clipping planes pour une section latérale
     */
    private static createSideClipPlanes(
        side: "left" | "right",
        edgePosition: number,
        config: DoorClipConfig,
    ): THREE.Plane[] {
        // Plan horizontal : garde en dessous de doorHeight
        const topClip = createHorizontalClipPlane(config.doorHeight, false);

        // Plan vertical : selon l'orientation du mur
        const verticalClip = this.createVerticalClip(
            side,
            edgePosition,
            config,
        );

        return [topClip, verticalClip];
    }

    /**
     * Crée le plan vertical pour le bord de la porte
     */
    private static createVerticalClip(
        side: "left" | "right",
        edgePosition: number,
        config: DoorClipConfig,
    ): THREE.Plane {
        const segmentPos = config.isBackWall
            ? config.segmentX
            : config.segmentZ;
        const edgeWorld = segmentPos + edgePosition;

        if (config.isBackWall) {
            // Back wall : découpe sur X
            // Gauche de la porte = garder X < edgeWorld
            // Droite de la porte = garder X > edgeWorld
            return createVerticalClipPlaneX(edgeWorld, side === "right");
        } else {
            // Murs latéraux : découpe sur Z
            // La direction dépend de quel côté de la pièce on est
            const isLeftWall = config.wallSide === "left";

            if (side === "left") {
                // Section gauche : garder Z < edgeWorld (mur left) ou Z > edgeWorld (mur right)
                return createVerticalClipPlaneZ(edgeWorld, !isLeftWall);
            } else {
                // Section droite : garder Z > edgeWorld (mur left) ou Z < edgeWorld (mur right)
                return createVerticalClipPlaneZ(edgeWorld, isLeftWall);
            }
        }
    }
}
