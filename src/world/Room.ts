import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

/**
 * Position d'une porte pour créer des ouvertures dans les murs
 */
export interface DoorPosition {
    /** Position 3D de la porte */
    position: THREE.Vector3;
    /** Côté du mur ("back", "left", "right") */
    side: "back" | "left" | "right";
}

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
    /** Positions des portes (pour créer des ouvertures dans les murs) */
    doorPositions?: DoorPosition[];
    /** Largeur des ouvertures de portes (défaut: 1.5) */
    doorWidth?: number;
    /** Ratio hauteur porte / hauteur mur (défaut: 2/3) */
    doorHeightRatio?: number;
}

/**
 * Room - Une pièce avec sol et murs
 */
export class Room {
    private group: THREE.Group;
    private config: Required<Omit<RoomConfig, "doorPositions">> & {
        doorPositions: DoorPosition[];
    };

    constructor(config: RoomConfig) {
        this.config = {
            width: config.width,
            depth: config.depth,
            height: config.height ?? 4,
            position: config.position ?? new THREE.Vector3(0, 0, 0),
            floorColor: config.floorColor ?? "#2a2a3a",
            wallColor: config.wallColor ?? "#3a3a4a",
            doorPositions: config.doorPositions ?? [],
            doorWidth: config.doorWidth ?? 1.5,
            doorHeightRatio: config.doorHeightRatio ?? 2 / 3,
        };

        this.group = new THREE.Group();
        this.group.position.copy(this.config.position);

        this.createFloor();
        this.createWalls();
        this.loadWallModels();
    }

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

    private updateFloorSize(width: number, depth: number): void {
        const floor = this.group.children.find(
            (child) => child.name === "floor",
        ) as THREE.Mesh | undefined;

        if (floor && floor.geometry) {
            floor.geometry.dispose();
            floor.geometry = new THREE.PlaneGeometry(width, depth);
            console.log(
                `[Room] Sol redimensionné : ${width.toFixed(2)}x${depth.toFixed(2)}`,
            );
        }
    }

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
                    child.position.z = -depth / 2 + offsets.back.z;
                    child.position.x = child.position.x + offsets.back.x;
                    child.position.y = offsets.back.y;
                } else if (side === "left") {
                    child.position.x = -width / 2 + offsets.left.x;
                    child.position.z = child.position.z + offsets.left.z;
                    child.position.y = offsets.left.y;
                } else if (side === "right") {
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

    private createWalls(): void {
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: this.config.wallColor,
            roughness: 0.8,
            side: THREE.DoubleSide,
        });

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

    private async loadWallModels(): Promise<void> {
        try {
            const wallModelPath = "/models/animated/empty_wall.glb";
            const wallOverlap = 1 / 3;
            const wallOffset = 0.25;

            const wallOffsets = {
                back: { x: 0, y: 0, z: wallOffset },
                left: { x: wallOffset, y: 0, z: 0 },
                right: { x: -wallOffset, y: 0, z: 0 },
            };

            const loader = new GLTFLoader();
            const gltf = await new Promise<any>((resolve, reject) => {
                loader.load(wallModelPath, resolve, undefined, reject);
            });
            const wallModel = gltf.scene;

            const box = new THREE.Box3().setFromObject(wallModel);
            const size = box.getSize(new THREE.Vector3());
            const wallWidth = size.x;
            const wallHeight = size.y;

            console.log(
                `[Room] Modèle de mur : ${wallWidth.toFixed(2)}x${size.y.toFixed(2)}x${size.z.toFixed(2)}`,
            );

            const actualWidth = this.createWallSegments(
                wallModel,
                wallWidth,
                wallHeight,
                this.config.width,
                0,
                -this.config.depth / 2,
                0,
                "back",
                wallOverlap,
            );

            const actualDepthLeft = this.createWallSegments(
                wallModel,
                wallWidth,
                wallHeight,
                this.config.depth,
                -this.config.width / 2,
                0,
                Math.PI / 2,
                "left",
                wallOverlap,
            );

            const actualDepthRight = this.createWallSegments(
                wallModel,
                wallWidth,
                wallHeight,
                this.config.depth,
                this.config.width / 2,
                0,
                -Math.PI / 2,
                "right",
                wallOverlap,
            );

            const actualDepth = Math.max(actualDepthLeft, actualDepthRight);
            this.updateFloorSize(actualWidth, actualDepth);
            this.repositionWalls(actualWidth, actualDepth, wallOffsets);
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
     * Crée une ouverture de porte dans un mur en utilisant des clipping planes
     * Crée 3 instances du mur : linteau (haut) + côté gauche + côté droit
     */
    private createDoorOpening(
        wallModel: THREE.Group,
        doorPosition: THREE.Vector3,
        wallHeight: number,
        segmentX: number,
        segmentZ: number,
        rotationY: number,
        side: string,
        segmentIndex: number,
    ): THREE.Group {
        const resultGroup = new THREE.Group();
        resultGroup.name = `fbxWall_${side}_${segmentIndex}`;
        resultGroup.position.set(segmentX, 0, segmentZ);
        resultGroup.rotation.y = rotationY;

        const doorWidth = this.config.doorWidth;
        const doorHeight = wallHeight * this.config.doorHeightRatio;

        // Détermine l'axe selon l'orientation du mur
        const isBackWall = Math.abs(rotationY) < 0.01;

        // Position de la porte relative au segment
        const doorLocalPos = isBackWall
            ? doorPosition.x - segmentX
            : doorPosition.z - segmentZ;

        // === LINTEAU (partie haute, au-dessus de la porte) ===
        const lintel = wallModel.clone();
        lintel.position.set(0, 0, 0);

        // Plane en coordonnées WORLD : coupe à Y = doorHeight (depuis le sol)
        const lintelClipPlane = new THREE.Plane(
            new THREE.Vector3(0, 1, 0),
            -doorHeight, // Hauteur absolue depuis Y=0
        );

        this.applyClippingPlanes(lintel, [lintelClipPlane]);
        resultGroup.add(lintel);

        // Bords de la porte (relatifs au segment)
        const leftEdge = doorLocalPos - doorWidth / 2;
        const rightEdge = doorLocalPos + doorWidth / 2;

        // === MUR GAUCHE ===
        const leftWall = wallModel.clone();
        leftWall.position.set(0, 0, 0);

        const leftClipTop = new THREE.Plane(
            new THREE.Vector3(0, -1, 0),
            doorHeight,
        );

        let leftClipRight: THREE.Plane;
        if (isBackWall) {
            // Back wall : découpe sur X
            leftClipRight = new THREE.Plane(
                new THREE.Vector3(-1, 0, 0),
                segmentX + leftEdge,
            );
        } else {
            // Murs latéraux : découpe sur Z
            const zNormal = side === "left" ? -1 : 1;
            const leftEdgeWorld = segmentZ + leftEdge;
            leftClipRight = new THREE.Plane(
                new THREE.Vector3(0, 0, zNormal),
                -zNormal * leftEdgeWorld,
            );
        }

        this.applyClippingPlanes(leftWall, [leftClipTop, leftClipRight]);
        resultGroup.add(leftWall);

        // === MUR DROIT ===
        const rightWall = wallModel.clone();
        rightWall.position.set(0, 0, 0);

        const rightClipTop = new THREE.Plane(
            new THREE.Vector3(0, -1, 0),
            doorHeight,
        );

        let rightClipLeft: THREE.Plane;
        if (isBackWall) {
            // Back wall : découpe sur X
            rightClipLeft = new THREE.Plane(
                new THREE.Vector3(1, 0, 0),
                -(segmentX + rightEdge),
            );
        } else {
            // Murs latéraux : découpe sur Z
            const zNormal = side === "left" ? -1 : 1;
            const rightEdgeWorld = segmentZ + rightEdge;
            rightClipLeft = new THREE.Plane(
                new THREE.Vector3(0, 0, -zNormal),
                zNormal * rightEdgeWorld,
            );
        }

        this.applyClippingPlanes(rightWall, [rightClipTop, rightClipLeft]);
        resultGroup.add(rightWall);

        console.log(
            `[Room] Ouverture créée : doorLocalPos=${doorLocalPos.toFixed(2)}, doorHeight=${doorHeight.toFixed(2)}`,
        );

        return resultGroup;
    }

    /**
     * Applique des clipping planes à tous les meshes d'un groupe
     */
    private applyClippingPlanes(
        group: THREE.Group,
        planes: THREE.Plane[],
    ): void {
        group.traverse((child) => {
            if (child instanceof THREE.Mesh && child.material) {
                // Clone le matériau pour ne pas affecter les autres instances
                child.material = child.material.clone();
                child.material.clippingPlanes = planes;
                child.material.clipShadows = true;
                child.material.side = THREE.DoubleSide;
            }
        });
    }

    private getDoorAtSegmentPosition(
        segmentX: number,
        segmentZ: number,
        wallWidth: number,
        side: string,
    ): DoorPosition | null {
        const doorWidth = this.config.doorWidth;
        const tolerance = wallWidth / 2 + doorWidth / 2;

        for (const doorPos of this.config.doorPositions) {
            if (doorPos.side !== side) continue;

            const dx = Math.abs(segmentX - doorPos.position.x);
            const dz = Math.abs(segmentZ - doorPos.position.z);

            if (side === "back") {
                if (dx < tolerance && dz < 0.5) {
                    return doorPos;
                }
            } else {
                if (dz < tolerance && dx < 0.5) {
                    return doorPos;
                }
            }
        }

        return null;
    }

    private createWallSegments(
        wallModel: THREE.Group,
        wallWidth: number,
        wallHeight: number,
        totalLength: number,
        x: number,
        z: number,
        rotationY: number,
        side: string,
        overlap: number,
    ): number {
        const effectiveWidth = wallWidth - overlap;
        const numWalls = Math.ceil(totalLength / effectiveWidth);
        const actualLength = (numWalls - 1) * effectiveWidth + wallWidth;
        const startOffset = -(actualLength / 2) + wallWidth / 2;

        let segmentsCreated = 0;

        for (let i = 0; i < numWalls; i++) {
            const offset = startOffset + i * effectiveWidth;

            let segmentX: number;
            let segmentZ: number;

            if (Math.abs(rotationY) === Math.PI || rotationY === 0) {
                segmentX = x + offset;
                segmentZ = z;
            } else {
                segmentX = x;
                segmentZ = z + offset;
            }

            const doorAtPosition = this.getDoorAtSegmentPosition(
                segmentX,
                segmentZ,
                wallWidth,
                side,
            );

            if (doorAtPosition) {
                console.log(
                    `[Room] Création d'une ouverture de porte dans le segment ${i} (${side})`,
                );

                const wallWithOpening = this.createDoorOpening(
                    wallModel,
                    doorAtPosition.position,
                    wallHeight,
                    segmentX,
                    segmentZ,
                    rotationY,
                    side,
                    i,
                );

                this.group.add(wallWithOpening);
                segmentsCreated++;
            } else {
                const wall = wallModel.clone();
                wall.position.set(segmentX, 0, segmentZ);
                wall.rotation.y = rotationY;
                wall.name = `fbxWall_${side}_${i}`;
                this.group.add(wall);
                segmentsCreated++;
            }
        }

        console.log(
            `[Room] ${segmentsCreated}/${numWalls} segments de mur ajoutés (${side})`,
        );
        return actualLength;
    }

    private removeTempWalls(): void {
        const tempWalls = this.group.children.filter((child) =>
            child.name.startsWith("tempWall_"),
        );
        tempWalls.forEach((wall) => this.group.remove(wall));
        console.log(`[Room] ${tempWalls.length} murs temporaires supprimés`);
    }

    public add(object: THREE.Object3D): void {
        this.group.add(object);
    }

    public getObject(): THREE.Group {
        return this.group;
    }

    public getDimensions(): { width: number; depth: number; height: number } {
        return {
            width: this.config.width,
            depth: this.config.depth,
            height: this.config.height,
        };
    }

    public checkCollision(
        position: THREE.Vector3,
        playerRadius: number = 0.5,
    ): boolean {
        const minX = -this.config.width / 2 + playerRadius;
        const maxX = this.config.width / 2 - playerRadius;
        const minZ = -this.config.depth / 2 + playerRadius;
        const maxZ = this.config.depth / 2 - playerRadius;

        return (
            position.x < minX ||
            position.x > maxX ||
            position.z < minZ ||
            position.z > maxZ
        );
    }
}
