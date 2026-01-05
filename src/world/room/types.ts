import * as THREE from "three";

/** Côtés possibles pour un mur */
export type WallSide = "back" | "left" | "right";

/**
 * Position d'une porte pour créer des ouvertures dans les murs
 */
export interface DoorPosition {
    /** Position 3D de la porte */
    position: THREE.Vector3;
    /** Côté du mur */
    side: WallSide;
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
    /** Largeur des ouvertures de portes */
    doorWidth?: number;
    /** Ratio hauteur porte / hauteur mur */
    doorHeightRatio?: number;
}

/** Configuration résolue (tous les champs requis) */
export type ResolvedRoomConfig = Required<Omit<RoomConfig, "doorPositions">> & {
    doorPositions: DoorPosition[];
};

/** Offsets pour repositionner les murs */
export interface WallOffsets {
    back: THREE.Vector3Like;
    left: THREE.Vector3Like;
    right: THREE.Vector3Like;
}

/** Configuration d'un segment de mur */
export interface WallSegmentConfig {
    model: THREE.Group;
    modelWidth: number;
    modelHeight: number;
    totalLength: number;
    x: number;
    z: number;
    rotationY: number;
    side: WallSide;
}

/** Configuration pour créer un clipping plane de porte */
export interface DoorClipConfig {
    doorHeight: number;
    doorWidth: number;
    doorLocalPos: number;
    isBackWall: boolean;
    wallSide: string;
    segmentX: number;
    segmentZ: number;
}
