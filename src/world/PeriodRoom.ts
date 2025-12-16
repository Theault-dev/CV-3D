import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { Teleporter } from "./Teleporter";
import { ProjectCube } from "./ProjectCube";
import type { Periode } from "../data/types";

/**
 * Configuration d'une salle de période
 */
export interface PeriodRoomConfig {
    periode: Periode;
}

/**
 * PeriodRoom - Salle 3D générée selon les données d'une période
 */
export class PeriodRoom {
    private group: THREE.Group;
    private periode: Periode;
    private projectCubes: ProjectCube[] = [];
    private competenceTrophies: THREE.Group[] = [];
    private teleporter: Teleporter | null = null;

    // Dimensions de la salle
    private static readonly WIDTH = 12;
    private static readonly DEPTH = 10;
    private static readonly HEIGHT = 4;

    constructor(config: PeriodRoomConfig) {
        this.periode = config.periode;
        this.group = new THREE.Group();

        this.createStructure();
        this.createProjectCubes();
        this.createCompetenceTrophies();
        this.createTeleporter();
    }

    /**
     * Crée le sol et les murs de la salle
     */
    private createStructure(): void {
        // Sol
        const floorGeometry = new THREE.PlaneGeometry(
            PeriodRoom.WIDTH,
            PeriodRoom.DEPTH,
        );
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: "#1a1a2a",
            roughness: 0.9,
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        this.group.add(floor);

        const wallMaterial = new THREE.MeshStandardMaterial({
            color: "#2a2a3a",
            roughness: 0.8,
            side: THREE.DoubleSide,
        });

        // Mur du fond (Z négatif)
        const backWall = new THREE.Mesh(
            new THREE.PlaneGeometry(PeriodRoom.WIDTH, PeriodRoom.HEIGHT),
            wallMaterial,
        );
        backWall.position.set(0, PeriodRoom.HEIGHT / 2, -PeriodRoom.DEPTH / 2);
        this.group.add(backWall);

        // Mur gauche (X négatif)
        const leftWall = new THREE.Mesh(
            new THREE.PlaneGeometry(PeriodRoom.DEPTH, PeriodRoom.HEIGHT),
            wallMaterial,
        );
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.set(-PeriodRoom.WIDTH / 2, PeriodRoom.HEIGHT / 2, 0);
        this.group.add(leftWall);

        // Mur droit (X positif)
        const rightWall = new THREE.Mesh(
            new THREE.PlaneGeometry(PeriodRoom.DEPTH, PeriodRoom.HEIGHT),
            wallMaterial,
        );
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.set(PeriodRoom.WIDTH / 2, PeriodRoom.HEIGHT / 2, 0);
        this.group.add(rightWall);

        // Mur de devant (Z positif) - pas créé pour permettre l'entrée
    }

    /**
     * Crée les cubes de projets disposés en grille
     */
    private createProjectCubes(): void {
        const cubesPerRow = 3;
        const spacing = 2;
        const startX = (-(cubesPerRow - 1) * spacing) / 2;

        this.periode.projets.forEach((projet, index) => {
            const row = Math.floor(index / cubesPerRow);
            const col = index % cubesPerRow;

            const x = startX + col * spacing;
            const z = row * spacing - 2; // Centré, légèrement vers l'avant

            const color = `hsl(${index * 60}, 70%, 60%)`;

            const cube = new ProjectCube({
                projet,
                position: new THREE.Vector3(x, 0, z),
                color,
            });

            this.projectCubes.push(cube);
            this.group.add(cube.getObject());
        });
    }

    /**
     * Crée les trophées de compétences sur les murs
     */
    private createCompetenceTrophies(): void {
        const competences = this.periode.competences;
        const spacing = 1.5;
        const wallHeight = 1.5;

        competences.forEach((competence, index) => {
            // Alterner entre mur gauche et mur droit
            const isLeft = index % 2 === 0;
            const wallIndex = Math.floor(index / 2);

            const x = isLeft
                ? -PeriodRoom.WIDTH / 2 + 0.3
                : PeriodRoom.WIDTH / 2 - 0.3;
            const z = -PeriodRoom.DEPTH / 2 + 2 + wallIndex * spacing;

            const trophy = this.createTrophy(
                competence,
                new THREE.Vector3(x, wallHeight, z),
                isLeft,
            );
            this.competenceTrophies.push(trophy);
            this.group.add(trophy);
        });
    }

    /**
     * Crée un trophée individuel
     */
    private createTrophy(
        competence: string,
        position: THREE.Vector3,
        facingLeft: boolean,
    ): THREE.Group {
        const trophyGroup = new THREE.Group();

        // Piédestal
        const pedestalGeometry = new THREE.CylinderGeometry(0.15, 0.2, 0.3, 8);
        const pedestalMaterial = new THREE.MeshStandardMaterial({
            color: "#8b7355",
            roughness: 0.7,
        });
        const pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
        trophyGroup.add(pedestal);

        // Sphère (trophée)
        const sphereGeometry = new THREE.SphereGeometry(0.12, 16, 16);
        const sphereMaterial = new THREE.MeshStandardMaterial({
            color: "#d4af37",
            metalness: 0.8,
            roughness: 0.2,
            emissive: "#d4af37",
            emissiveIntensity: 0.2,
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.y = 0.25;
        trophyGroup.add(sphere);

        // Label
        const labelDiv = document.createElement("div");
        labelDiv.className = "competence-trophy-label";
        labelDiv.textContent = competence;
        const label = new CSS2DObject(labelDiv);
        label.position.set(facingLeft ? 0.3 : -0.3, 0.4, 0);
        trophyGroup.add(label);

        trophyGroup.position.copy(position);

        return trophyGroup;
    }

    /**
     * Crée le téléporteur de retour
     */
    private createTeleporter(): void {
        // Position au fond de la salle, opposé à l'entrée
        const teleporterPosition = new THREE.Vector3(
            0,
            0,
            -PeriodRoom.DEPTH / 2 + 2,
        );

        this.teleporter = new Teleporter({ position: teleporterPosition });
        this.group.add(this.teleporter.getObject());
    }

    /**
     * Retourne le groupe 3D
     */
    public getObject(): THREE.Group {
        return this.group;
    }

    /**
     * Retourne la position d'entrée du joueur
     */
    public getEntryPosition(): THREE.Vector3 {
        return new THREE.Vector3(0, 0, PeriodRoom.DEPTH / 2 - 1.5);
    }

    /**
     * Retourne le téléporteur
     */
    public getTeleporter(): Teleporter | null {
        return this.teleporter;
    }

    /**
     * Retourne les cubes de projets
     */
    public getProjectCubes(): ProjectCube[] {
        return this.projectCubes;
    }
}
