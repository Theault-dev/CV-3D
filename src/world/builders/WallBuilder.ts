import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DoorOpeningBuilder } from "./DoorOpeningBuilder";
import type {
    DoorPosition,
    WallSide,
    WallOffsets,
    DoorClipConfig,
} from "../room/types";
import { WALL_MODEL_PATH, WALL_OVERLAP, WALL_OFFSET } from "../room/constants";

export interface WallBuilderConfig {
    width: number;
    depth: number;
    height: number;
    wallColor: string;
    doorPositions: DoorPosition[];
    doorWidth: number;
    doorHeightRatio: number;
}

interface WallSegmentResult {
    actualLength: number;
    segments: THREE.Object3D[];
}

/**
 * WallBuilder - Création et gestion des murs d'une pièce
 */
export class WallBuilder {
    private config: WallBuilderConfig;
    private tempWalls: THREE.Mesh[] = [];
    private wallSegments: THREE.Object3D[] = [];

    constructor(config: WallBuilderConfig) {
        this.config = config;
    }

    /**
     * Crée les murs temporaires (affichés pendant le chargement des modèles)
     */
    public createTempWalls(): THREE.Mesh[] {
        const material = new THREE.MeshStandardMaterial({
            color: this.config.wallColor,
            roughness: 0.8,
            side: THREE.DoubleSide,
        });

        const wallConfigs: Array<{
            name: string;
            width: number;
            rotationY: number;
            position: THREE.Vector3;
        }> = [
            {
                name: "tempWall_back",
                width: this.config.width,
                rotationY: 0,
                position: new THREE.Vector3(
                    0,
                    this.config.height / 2,
                    -this.config.depth / 2,
                ),
            },
            {
                name: "tempWall_left",
                width: this.config.depth,
                rotationY: Math.PI / 2,
                position: new THREE.Vector3(
                    -this.config.width / 2,
                    this.config.height / 2,
                    0,
                ),
            },
            {
                name: "tempWall_right",
                width: this.config.depth,
                rotationY: -Math.PI / 2,
                position: new THREE.Vector3(
                    this.config.width / 2,
                    this.config.height / 2,
                    0,
                ),
            },
        ];

        this.tempWalls = wallConfigs.map((wc) => {
            const wall = new THREE.Mesh(
                new THREE.PlaneGeometry(wc.width, this.config.height),
                material,
            );
            wall.rotation.y = wc.rotationY;
            wall.position.copy(wc.position);
            wall.name = wc.name;
            return wall;
        });

        return this.tempWalls;
    }

    /**
     * Charge les modèles de murs et crée les segments
     * @returns Les dimensions réelles et les offsets à appliquer
     */
    public async loadAndCreateWalls(): Promise<{
        actualWidth: number;
        actualDepth: number;
        offsets: WallOffsets;
        segments: THREE.Object3D[];
    }> {
        const loader = new GLTFLoader();
        const gltf = await new Promise<any>((resolve, reject) => {
            loader.load(WALL_MODEL_PATH, resolve, undefined, reject);
        });

        const wallModel = gltf.scene;
        const box = new THREE.Box3().setFromObject(wallModel);
        const size = box.getSize(new THREE.Vector3());
        const modelWidth = size.x;
        const modelHeight = size.y;

        console.log(
            `[WallBuilder] Modèle : ${modelWidth.toFixed(2)}x${size.y.toFixed(2)}x${size.z.toFixed(2)}`,
        );

        // Création des segments pour chaque mur
        const backResult = this.createWallSegments(
            wallModel,
            modelWidth,
            modelHeight,
            this.config.width,
            0,
            -this.config.depth / 2,
            0,
            "back",
        );

        const leftResult = this.createWallSegments(
            wallModel,
            modelWidth,
            modelHeight,
            this.config.depth,
            -this.config.width / 2,
            0,
            Math.PI / 2,
            "left",
        );

        const rightResult = this.createWallSegments(
            wallModel,
            modelWidth,
            modelHeight,
            this.config.depth,
            this.config.width / 2,
            0,
            -Math.PI / 2,
            "right",
        );

        this.wallSegments = [
            ...backResult.segments,
            ...leftResult.segments,
            ...rightResult.segments,
        ];

        const offsets: WallOffsets = {
            back: { x: 0, y: 0, z: WALL_OFFSET },
            left: { x: WALL_OFFSET, y: 0, z: 0 },
            right: { x: -WALL_OFFSET, y: 0, z: 0 },
        };

        return {
            actualWidth: backResult.actualLength,
            actualDepth: Math.max(
                leftResult.actualLength,
                rightResult.actualLength,
            ),
            offsets,
            segments: this.wallSegments,
        };
    }

    /**
     * Crée les segments de mur pour un côté
     */
    private createWallSegments(
        wallModel: THREE.Group,
        modelWidth: number,
        modelHeight: number,
        totalLength: number,
        x: number,
        z: number,
        rotationY: number,
        side: WallSide,
    ): WallSegmentResult {
        const effectiveWidth = modelWidth - WALL_OVERLAP;
        const numWalls = Math.ceil(totalLength / effectiveWidth);
        const actualLength = (numWalls - 1) * effectiveWidth + modelWidth;
        const startOffset = -(actualLength / 2) + modelWidth / 2;

        const isHorizontalWall =
            Math.abs(rotationY) === Math.PI || rotationY === 0;
        const segments: THREE.Object3D[] = [];

        for (let i = 0; i < numWalls; i++) {
            const offset = startOffset + i * effectiveWidth;
            const segmentX = isHorizontalWall ? x + offset : x;
            const segmentZ = isHorizontalWall ? z : z + offset;

            const doorAtPosition = this.findDoorAtPosition(
                segmentX,
                segmentZ,
                modelWidth,
                side,
            );

            if (doorAtPosition) {
                console.log(
                    `[WallBuilder] Ouverture dans segment ${i} (${side})`,
                );

                const isBackWall = Math.abs(rotationY) < 0.01;
                const doorLocalPos = isBackWall
                    ? doorAtPosition.position.x - segmentX
                    : doorAtPosition.position.z - segmentZ;

                const clipConfig: DoorClipConfig = {
                    doorHeight: modelHeight * this.config.doorHeightRatio,
                    doorWidth: this.config.doorWidth,
                    doorLocalPos,
                    isBackWall,
                    wallSide: side,
                    segmentX,
                    segmentZ,
                };

                const wallWithOpening = DoorOpeningBuilder.create(
                    wallModel,
                    clipConfig,
                    i,
                );
                segments.push(wallWithOpening);
            } else {
                const wall = wallModel.clone();
                wall.position.set(segmentX, 0, segmentZ);
                wall.rotation.y = rotationY;
                wall.name = `fbxWall_${side}_${i}`;
                segments.push(wall);
            }
        }

        console.log(`[WallBuilder] ${segments.length} segments (${side})`);
        return { actualLength, segments };
    }

    /**
     * Trouve une porte à la position du segment
     */
    private findDoorAtPosition(
        segmentX: number,
        segmentZ: number,
        modelWidth: number,
        side: WallSide,
    ): DoorPosition | null {
        const tolerance = modelWidth / 2 + this.config.doorWidth / 2;

        for (const doorPos of this.config.doorPositions) {
            if (doorPos.side !== side) continue;

            const dx = Math.abs(segmentX - doorPos.position.x);
            const dz = Math.abs(segmentZ - doorPos.position.z);

            const isMatch =
                side === "back"
                    ? dx < tolerance && dz < 0.5
                    : dz < tolerance && dx < 0.5;

            if (isMatch) return doorPos;
        }

        return null;
    }

    /**
     * Repositionne les segments de murs selon les nouvelles dimensions
     */
    public static repositionSegments(
        segments: THREE.Object3D[],
        width: number,
        depth: number,
        offsets: WallOffsets,
    ): void {
        for (const segment of segments) {
            if (!segment.name.startsWith("fbxWall_")) continue;

            const side = segment.name.split("_")[1] as WallSide;
            const offset = offsets[side];

            if (side === "back") {
                segment.position.z = -depth / 2 + offset.z;
                segment.position.x += offset.x;
            } else if (side === "left") {
                segment.position.x = -width / 2 + offset.x;
                segment.position.z += offset.z;
            } else if (side === "right") {
                segment.position.x = width / 2 + offset.x;
                segment.position.z += offset.z;
            }
            segment.position.y = offset.y;
        }
    }

    /**
     * Retourne les murs temporaires à supprimer
     */
    public getTempWalls(): THREE.Mesh[] {
        return this.tempWalls;
    }

    /**
     * Libère les ressources des murs temporaires
     */
    public disposeTempWalls(): void {
        for (const wall of this.tempWalls) {
            wall.geometry.dispose();
            if (wall.material instanceof THREE.Material) {
                wall.material.dispose();
            }
        }
        this.tempWalls = [];
    }
}
