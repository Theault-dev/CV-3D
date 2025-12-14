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

// Crée le hall principal
const hall = new Room({
    width: 20,
    depth: 15,
    height: 5,
    floorColor: "#2a2a3a",
    wallColor: "#3a3a4a",
});
engine.add(hall.getObject());

// Crée les 3 portes
const doors: Door[] = [
    new Door({
        id: "ensicaen",
        title: "ENSICAEN",
        subtitle: "2017 - 2020",
        position: new THREE.Vector3(-5, 0, -7),
        color: "#4a6741",
    }),
    new Door({
        id: "nxp",
        title: "NXP Semiconductors",
        subtitle: "2017 - 2020",
        position: new THREE.Vector3(0, 0, -7),
        color: "#6b4423",
    }),
    new Door({
        id: "genoway",
        title: "genOway",
        subtitle: "2022 - Présent",
        position: new THREE.Vector3(5, 0, -7),
        color: "#234b6b",
    }),
];

doors.forEach((door) => engine.add(door.getObject()));

// Crée le joueur
const player = new Player(engine.getCamera(), input, {
    startPosition: new THREE.Vector3(0, 0, 5),
    moveSpeed: 5,
});
engine.add(player.getObject());

// Porte actuellement proche
let nearbyDoor: Door | null = null;

// Fonction appelée quand on entre dans une porte
async function enterDoor(door: Door): Promise<void> {
    const doorId = door.getId();

    try {
        const periode = await api.getPeriode(doorId);

        // Créer le contenu de l'overlay
        const content = document.createElement("div");
        content.innerHTML = `
            <h1>${periode.titre}</h1>
            <h2>${periode.lieu}</h2>
            <p>${periode.dates.debut} - ${periode.dates.fin}</p>
            <p>${periode.description}</p>
            <p>${periode.competences}</p>
            <p>${periode.projets}</p>
        `;

        // Ouvrir l'overlay (remplace le alert())
        overlayManager.open(content);
    } catch (error) {
        console.error("❌ Erreur API:", error);
    }
}

// Boucle de mise à jour
engine.onUpdate((delta) => {
    player.update(delta);

    const playerPos = player.getPosition();
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
});

// Démarre le moteur
engine.start();
