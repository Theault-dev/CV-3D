import "./style.css";
import * as THREE from "three";
import { Engine } from "./core/Engine";
import { InputManager } from "./core/InputManager";
import { Player } from "./player/Player";
import { Room } from "./world/Room";
import { Door } from "./world/Door";
import { InteractionPrompt } from "./ui/InteractionPrompt";
import { HUD } from "./ui/HUD";
import { OverlayManager } from "./ui/OverlayManager";
import { KeyboardIndicator } from "./ui/KeyboardIndicator";
import { ApiService } from "./services/ApiService";
import { RoomManager } from "./world/RoomManager";
import { ProjectCube } from "./world/ProjectCube";
import type { Projet } from "./data/types";

// Crée le moteur 3D et l'input manager
const engine = new Engine();
const input = new InputManager();

// Crée le gestionnaire d'overlays
const overlayManager = new OverlayManager();

// Connecte l'overlay manager à l'input manager
// (pour bloquer les inputs du jeu quand un overlay est actif)
input.setOverlayManager(overlayManager);

// Crée le service API
const api = new ApiService();

// Crée l'UI d'interaction
const interactionPrompt = new InteractionPrompt();

// Crée le HUD avec les raccourcis permanents
new HUD();

// Crée et initialise l'indicateur de touches de déplacement
const keyboardIndicator = new KeyboardIndicator();
await keyboardIndicator.init();

// Connecte l'indicateur de touches à l'input manager
// (pour gérer la touche H)
input.setKeyboardIndicator(keyboardIndicator);

// Affiche l'indicateur automatiquement au démarrage (pendant 5 secondes)
keyboardIndicator.show();

/**
 * Calcule les dimensions optimales de la salle selon le nombre de portes
 * @param formationCount - Nombre de portes de formation (mur gauche)
 * @param travailCount - Nombre de portes de travail (mur du fond)
 * @returns Dimensions de la salle
 */
function calculateRoomDimensions(
    formationCount: number,
    travailCount: number,
): { width: number; depth: number; height: number } {
    // Espacement minimum entre portes (largeur porte = 1.5, donc 3 unités = bon espacement)
    const minSpacing = 3;

    // Marges de sécurité autour de la salle (réduites de moitié)
    const widthMargin = 4; // Marge gauche/droite
    const depthMargin = 7; // Marge avant (entrée) / arrière

    // Largeur minimale et maximale de la salle (réduites de moitié)
    const minWidth = 14;
    const maxWidth = 33;

    // Profondeur minimale et maximale de la salle (réduites de moitié)
    const minDepth = 11;
    const maxDepth = 28;

    // Calcul de la largeur nécessaire pour les portes du mur du fond (axe X)
    // Nombre de portes * espacement minimum + marges
    const neededWidth = Math.max(
        minWidth,
        Math.min(maxWidth, travailCount * minSpacing + widthMargin),
    );

    // Calcul de la profondeur nécessaire pour les portes du mur gauche (axe Z)
    // Nombre de portes * espacement minimum + marges
    const neededDepth = Math.max(
        minDepth,
        Math.min(maxDepth, formationCount * minSpacing + depthMargin),
    );

    return {
        width: neededWidth,
        depth: neededDepth,
        height: 5, // Hauteur fixe
    };
}

/**
 * Calcule la position d'une porte selon son type et son index
 * @param type - "formation" (mur gauche) ou "travail" (mur du fond)
 * @param index - Position dans l'ordre chronologique
 * @param totalOfType - Nombre total de portes de ce type
 * @param roomWidth - Largeur de la salle
 * @param roomDepth - Profondeur de la salle
 * @returns Position THREE.Vector3 et rotation
 */
function calculateDoorPosition(
    type: "formation" | "travail",
    index: number,
    totalOfType: number,
    roomWidth: number,
    roomDepth: number,
): { position: THREE.Vector3; rotation: number } {
    if (type === "formation") {
        // Mur gauche : X = -roomWidth/2, Z varie selon l'index
        // Ancien proche entrée (Z positif) → récent vers fond (Z négatif)
        const leftWallX = -roomWidth / 2;
        const availableDepth = roomDepth - 5; // Marge de 5 unités (entrée + fond)
        const spacing = availableDepth / Math.max(totalOfType, 1);
        const startZ = roomDepth / 2 - 2.5; // Commence proche de l'entrée
        const z = startZ - index * spacing;

        return {
            position: new THREE.Vector3(leftWallX, 0, z),
            rotation: Math.PI / 2, // 90° pour face vers l'est
        };
    } else {
        // Mur du fond : Z = -roomDepth/2, X varie selon l'index
        // Ancien à gauche (X négatif) → récent à droite (X positif)
        const backWallZ = -roomDepth / 2;
        const availableWidth = roomWidth - 4; // Marge de 4 unités (gauche + droite)
        const spacing = availableWidth / Math.max(totalOfType - 1, 1);
        const startX = -availableWidth / 2;
        const x = startX + index * spacing;

        return {
            position: new THREE.Vector3(x, 0, backWallZ),
            rotation: 0, // Face vers le joueur
        };
    }
}

// Chargement dynamique des portes depuis l'API
let doors: Door[] = [];

/**
 * Initialise la salle et les portes dynamiquement depuis l'API
 */
async function initializeWorld(): Promise<THREE.Group> {
    const hallGroup = new THREE.Group();

    try {
        console.log("🚪 Chargement des périodes depuis l'API...");
        const cvData = await api.getCV();

        // Tri chronologique par date de début
        const sortedPeriods = cvData.periodes.sort((a, b) => {
            return a.dates.debut.localeCompare(b.dates.debut);
        });

        // Séparation par type
        const formations = sortedPeriods.filter((p) => p.type === "formation");
        const travaux = sortedPeriods.filter((p) => p.type === "travail");

        // Calcul des dimensions optimales de la salle
        const roomDimensions = calculateRoomDimensions(
            formations.length,
            travaux.length,
        );

        console.log(
            `📐 Dimensions de la salle : ${roomDimensions.width}x${roomDimensions.depth}x${roomDimensions.height}`,
        );

        // Crée le hall avec les dimensions calculées
        const hall = new Room({
            width: roomDimensions.width,
            depth: roomDimensions.depth,
            height: roomDimensions.height,
            floorColor: "#2a2a3a",
            wallColor: "#3a3a4a",
        });
        hallGroup.add(hall.getObject());

        // Génération des portes de formation
        formations.forEach((periode, index) => {
            const { position, rotation } = calculateDoorPosition(
                "formation",
                index,
                formations.length,
                roomDimensions.width,
                roomDimensions.depth,
            );

            const door = new Door({
                id: periode.id,
                title: periode.titre,
                subtitle: `${periode.dates.debut} - ${periode.dates.fin}`,
                position: position,
                rotation: rotation,
                color: "#4a6741", // Vert pour formations
            });

            doors.push(door);
            hallGroup.add(door.getObject());
        });

        // Génération des portes de travail
        travaux.forEach((periode, index) => {
            const { position, rotation } = calculateDoorPosition(
                "travail",
                index,
                travaux.length,
                roomDimensions.width,
                roomDimensions.depth,
            );

            const door = new Door({
                id: periode.id,
                title: periode.titre,
                subtitle: `${periode.dates.debut} - ${periode.dates.fin}`,
                position: position,
                rotation: rotation,
                color: "#6b4423", // Marron pour travail
            });

            doors.push(door);
            hallGroup.add(door.getObject());
        });

        console.log(
            `✅ ${doors.length} portes générées (${formations.length} formations, ${travaux.length} travaux)`,
        );

        // Ajouter le hallGroup à la scène
        engine.add(hallGroup);

        return hallGroup;
    } catch (error) {
        console.error("❌ Erreur lors du chargement des portes:", error);

        // Fallback : créer une salle par défaut avec une porte d'erreur
        const defaultHall = new Room({
            width: 20,
            depth: 15,
            height: 5,
            floorColor: "#2a2a3a",
            wallColor: "#3a3a4a",
        });
        hallGroup.add(defaultHall.getObject());

        const fallbackDoor = new Door({
            id: "error",
            title: "Erreur de chargement",
            subtitle: "API inaccessible",
            position: new THREE.Vector3(0, 0, -7.5),
            color: "#ff0000",
        });
        doors.push(fallbackDoor);
        hallGroup.add(fallbackDoor.getObject());

        engine.add(hallGroup);

        return hallGroup;
    }
}

// Initialisation du monde (salle + portes)
const hallGroup = await initializeWorld();

// Crée le joueur
const player = new Player(engine.getCamera(), input, {
    startPosition: new THREE.Vector3(0, 0, 5),
    moveSpeed: 5,
});
engine.add(player.getObject());

// Crée le gestionnaire de salles
const roomManager = new RoomManager(engine, hallGroup, player);

// Connecte le room manager à l'input manager (pour Escape)
input.setRoomManager(roomManager);

// Porte actuellement proche
let nearbyDoor: Door | null = null;

// Fonction appelée quand on entre dans une porte
async function enterDoor(door: Door): Promise<void> {
    const doorId = door.getId();

    try {
        // Cacher le prompt pendant le chargement
        interactionPrompt.hide();

        // Charger les données de la période
        const periode = await api.getPeriode(doorId);

        // Entrer dans la salle
        await roomManager.enterPeriodRoom(periode);

        // Marquer la porte comme ouverte
        door.setOpen(true);
    } catch (error) {
        console.error("❌ Erreur API:", error);

        // Afficher overlay d'erreur
        const content = document.createElement("div");
        content.innerHTML = `
            <h1>Erreur</h1>
            <p>Impossible de charger la période.</p>
        `;
        overlayManager.open(content);
    }
}

// Fonction pour afficher les détails d'un projet
function showProjectOverlay(projet: Projet): void {
    const content = document.createElement("div");
    content.className = "project-overlay";
    content.innerHTML = `
        <h1>${projet.nom}</h1>
        <p>${projet.description}</p>
        <h3>Technologies</h3>
        <ul>
            ${projet.technos.map((t) => `<li>${t}</li>`).join("")}
        </ul>
    `;
    overlayManager.open(content);
}

// Boucle de mise à jour
engine.onUpdate((delta) => {
    player.update(delta);

    const playerPos = player.getPosition();

    // === MODE HALL ===
    if (roomManager.isInHall()) {
        let foundDoor: Door | null = null;

        for (const door of doors) {
            if (door.isNear(playerPos, 2.5)) {
                foundDoor = door;
                door.highlight(true);
            } else {
                door.highlight(false);
            }
        }

        if (foundDoor !== nearbyDoor) {
            nearbyDoor = foundDoor;
            if (nearbyDoor) {
                interactionPrompt.show("Entrer");
            } else {
                interactionPrompt.hide();
            }
        }

        if (nearbyDoor && input.isKeyJustPressed("e")) {
            enterDoor(nearbyDoor);
        }
    }

    // === MODE PERIOD ROOM ===
    if (roomManager.isInPeriodRoom()) {
        const periodRoom = roomManager.getActivePeriodRoom();
        if (!periodRoom) return;

        // 1. Check interaction avec cubes de projets
        const projectCubes = periodRoom.getProjectCubes();
        let foundCube: ProjectCube | null = null;

        for (const cube of projectCubes) {
            if (cube.isNear(playerPos, 1.5)) {
                foundCube = cube;
                cube.highlight(true);
            } else {
                cube.highlight(false);
            }
        }

        // 2. Check interaction avec téléporteur
        const teleporter = periodRoom.getTeleporter();
        let onTeleporter = false;

        if (teleporter && teleporter.isNear(playerPos, 2)) {
            onTeleporter = true;
            teleporter.update(delta); // Animation rotation
        }

        // 3. Gestion du prompt
        if (foundCube) {
            interactionPrompt.show("Examiner");
            if (input.isKeyJustPressed("e")) {
                showProjectOverlay(foundCube.getProjet());
            }
        } else if (onTeleporter) {
            interactionPrompt.show("Retour au hall");
            if (input.isKeyJustPressed("e")) {
                roomManager.exitToHall();
                interactionPrompt.hide();
            }
        } else {
            interactionPrompt.hide();
        }
    }
});

// Démarre le moteur
engine.start();
