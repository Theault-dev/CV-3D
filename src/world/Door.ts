import * as THREE from "three";

/**
 * Configuration d'une porte
 */
export interface DoorConfig {
    /** ID unique (correspond à l'ID de la période dans l'API) */
    id: string;
    /** Titre affiché au-dessus de la porte */
    title: string;
    /** Sous-titre (dates) */
    subtitle: string;
    /** Position de la porte */
    position: THREE.Vector3;
    /** Rotation Y en radians */
    rotation?: number;
    /** Couleur de la porte */
    color?: string;
}

/**
 * Door - Une porte menant à une période du CV
 */
export class Door {
    private group: THREE.Group;
    private id: string;
    private isHighlighted: boolean = false;

    // Dimensions de la porte
    private static readonly WIDTH = 1.5;
    private static readonly HEIGHT = 2.5;
    private static readonly DEPTH = 0.2;

    // Matériaux (partagés pour optimisation)
    private frameMaterial: THREE.MeshStandardMaterial;
    private doorMaterial: THREE.MeshStandardMaterial;

    constructor(config: DoorConfig) {
        this.id = config.id;
        this.group = new THREE.Group();

        // Matériaux
        this.frameMaterial = new THREE.MeshStandardMaterial({
            color: "#4a3728",
            roughness: 0.8,
        });
        this.doorMaterial = new THREE.MeshStandardMaterial({
            color: config.color ?? "#6b4423",
            roughness: 0.6,
        });

        // Crée la porte
        this.createDoor();

        // Crée le texte (titre + dates)
        this.createText(config.title, config.subtitle);

        // Position et rotation
        this.group.position.copy(config.position);
        if (config.rotation) {
            this.group.rotation.y = config.rotation;
        }
    }

    /**
     * Crée la géométrie de la porte
     */
    private createDoor(): void {
        // Cadre de la porte
        const frameThickness = 0.15;

        // Montant gauche
        const leftFrame = new THREE.Mesh(
            new THREE.BoxGeometry(frameThickness, Door.HEIGHT, Door.DEPTH),
            this.frameMaterial,
        );
        leftFrame.position.set(
            -Door.WIDTH / 2 - frameThickness / 2,
            Door.HEIGHT / 2,
            0,
        );
        this.group.add(leftFrame);

        // Montant droit
        const rightFrame = new THREE.Mesh(
            new THREE.BoxGeometry(frameThickness, Door.HEIGHT, Door.DEPTH),
            this.frameMaterial,
        );
        rightFrame.position.set(
            Door.WIDTH / 2 + frameThickness / 2,
            Door.HEIGHT / 2,
            0,
        );
        this.group.add(rightFrame);

        // Traverse supérieure
        const topFrame = new THREE.Mesh(
            new THREE.BoxGeometry(
                Door.WIDTH + frameThickness * 2,
                frameThickness,
                Door.DEPTH,
            ),
            this.frameMaterial,
        );
        topFrame.position.set(0, Door.HEIGHT + frameThickness / 2, 0);
        this.group.add(topFrame);

        // Panneau de la porte
        const doorPanel = new THREE.Mesh(
            new THREE.BoxGeometry(Door.WIDTH, Door.HEIGHT, Door.DEPTH * 0.5),
            this.doorMaterial,
        );
        doorPanel.position.set(0, Door.HEIGHT / 2, 0);
        this.group.add(doorPanel);

        // Poignée
        const handleGeometry = new THREE.SphereGeometry(0.08, 16, 16);
        const handleMaterial = new THREE.MeshStandardMaterial({
            color: "#d4af37",
            metalness: 0.8,
            roughness: 0.2,
        });
        const handle = new THREE.Mesh(handleGeometry, handleMaterial);
        handle.position.set(
            Door.WIDTH / 2 - 0.2,
            Door.HEIGHT / 2,
            Door.DEPTH * 0.3,
        );
        this.group.add(handle);
    }

    /**
     * Crée le texte au-dessus de la porte
     */
    private createText(title: string, subtitle: string): void {
        // Pour l'instant, on utilise un panneau coloré comme placeholder
        // Plus tard on pourra utiliser TextGeometry ou des sprites

        // Panneau pour le titre
        const panelGeometry = new THREE.PlaneGeometry(2, 0.8);
        const panelMaterial = new THREE.MeshStandardMaterial({
            color: "#1a1a2e",
            side: THREE.DoubleSide,
        });
        const panel = new THREE.Mesh(panelGeometry, panelMaterial);
        panel.position.set(0, Door.HEIGHT + 0.7, 0.1);
        this.group.add(panel);

        // On stocke le titre dans userData pour l'afficher plus tard
        this.group.userData = {
            title,
            subtitle,
        };
    }

    /**
     * Met en surbrillance la porte (quand le joueur est proche)
     */
    public highlight(enabled: boolean): void {
        if (this.isHighlighted === enabled) return;

        this.isHighlighted = enabled;
        this.doorMaterial.emissive = new THREE.Color(
            enabled ? "#333333" : "#000000",
        );
    }

    /**
     * Retourne l'ID de la porte
     */
    public getId(): string {
        return this.id;
    }

    /**
     * Retourne le groupe 3D
     */
    public getObject(): THREE.Group {
        return this.group;
    }

    /**
     * Retourne la position de la porte
     */
    public getPosition(): THREE.Vector3 {
        return this.group.position.clone();
    }

    /**
     * Vérifie si un point est proche de la porte
     */
    public isNear(position: THREE.Vector3, threshold: number = 2): boolean {
        const doorPos = this.group.position.clone();
        doorPos.y = position.y; // Ignore la hauteur
        return position.distanceTo(doorPos) < threshold;
    }
}
