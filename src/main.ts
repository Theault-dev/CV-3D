import "./style.css";
import * as THREE from "three";
import { Engine } from "./core/Engine";
import { InputManager } from "./core/InputManager";
import { Player } from "./player/Player";
import { Room } from "./world/Room";
import { Door } from "./world/Door";
import { InteractionPrompt } from "./ui/InteractionPrompt";
import { ApiService } from "./services/ApiService";

// Crée le moteur 3D et l'input manager
const engine = new Engine();
const input = new InputManager();

// Crée le service API
const api = new ApiService();

// Crée l'UI d'interaction
const interactionPrompt = new InteractionPrompt();

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
    console.log(`🚪 Entrée dans: ${doorId}`);

    try {
        // Récupère les données depuis l'API
        const periode = await api.getPeriode(doorId);

        console.log("📄 Données reçues:", periode);

        // Affiche les infos (temporaire)
        const projetsText = periode.projets
            .map((p) => `  - ${p.nom}: ${p.description}`)
            .join("\n");

        const competencesText = periode.competences.join(", ");

        alert(
            `${periode.titre} @ ${periode.lieu}\n` +
                `${periode.dates.debut} - ${periode.dates.fin}\n\n` +
                `${periode.description}\n\n` +
                `Projets:\n${projetsText || "  (aucun)"}\n\n` +
                `Compétences: ${competencesText}`,
        );
    } catch (error) {
        console.error("❌ Erreur API:", error);
        alert("Erreur lors du chargement des données.");
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
