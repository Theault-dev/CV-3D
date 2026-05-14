import * as THREE from "three";
import { FBXLoader } from "three-stdlib";

/**
 * Service de chargement de modèles 3D avec système de cache
 */
export class ModelLoader {
    private static loader: FBXLoader = new FBXLoader();
    private static cache: Map<string, THREE.Group> = new Map();

    /**
     * Charge un modèle FBX depuis une URL avec configuration automatique
     * @param url - Chemin vers le fichier FBX
     * @param scale - Facteur d'échelle à appliquer (défaut: 0.015)
     * @returns Promise résolue avec le modèle chargé et configuré
     */
    public static async loadFBX(
        url: string,
        scale: number = 0.015,
    ): Promise<THREE.Group> {
        // Vérifie le cache d'abord
        if (this.cache.has(url)) {
            console.log(`[ModelLoader] Modèle "${url}" trouvé dans le cache`);
            const cached = this.cache.get(url)!;
            // Clone le modèle pour permettre plusieurs instances
            return this.configureModel(cached.clone(), scale);
        }

        console.log(`[ModelLoader] Chargement du modèle "${url}"...`);

        try {
            const fbx = await this.loader.loadAsync(url);

            console.log(`[ModelLoader] Modèle "${url}" chargé avec succès`);

            // Met en cache le modèle original
            this.cache.set(url, fbx.clone());

            // Configure et retourne le modèle
            return this.configureModel(fbx, scale);
        } catch (error) {
            console.error(
                `[ModelLoader] Erreur lors du chargement de "${url}":`,
                error,
            );
            throw new Error(
                `Impossible de charger le modèle "${url}": ${error}`,
            );
        }
    }

    /**
     * Configure un modèle FBX : échelle, position, matériaux et ombres
     * @param fbx - Le modèle FBX à configurer
     * @param scale - Facteur d'échelle
     * @returns Le modèle configuré dans un groupe avec orientation corrigée
     */
    private static configureModel(
        fbx: THREE.Group,
        scale: number,
    ): THREE.Group {
        // Applique l'échelle
        fbx.scale.set(scale, scale, scale);

        // Calcule la position avant toute rotation
        const box = new THREE.Box3().setFromObject(fbx);
        const center = box.getCenter(new THREE.Vector3());

        // Positionne le modèle : centré en X/Z, avec les pieds au niveau du sol
        fbx.position.set(-center.x, -box.min.y, -center.z);

        // Configure les matériaux pour utiliser les lumières de la scène
        fbx.traverse((child) => {
            if (child instanceof THREE.Mesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach((mat) => {
                            if (mat instanceof THREE.MeshStandardMaterial) {
                                mat.needsUpdate = true;
                            }
                        });
                    } else if (
                        child.material instanceof THREE.MeshStandardMaterial
                    ) {
                        child.material.needsUpdate = true;
                    }
                }
            }
        });

        // Crée un groupe pour contenir le modèle avec sa correction d'orientation
        // Le FBX est placé dans un groupe enfant avec une rotation fixe de 180°
        // tandis que le groupe parent sera tourné par le système de contrôle
        const modelGroup = new THREE.Group();
        fbx.rotation.y = Math.PI; // Correction fixe de l'orientation
        modelGroup.add(fbx);

        return modelGroup;
    }

    /**
     * Vide le cache de modèles
     */
    public static clearCache(): void {
        console.log("[ModelLoader] Vidage du cache");
        this.cache.clear();
    }

    /**
     * Supprime un modèle spécifique du cache
     * @param url - URL du modèle à supprimer
     */
    public static removeFromCache(url: string): void {
        if (this.cache.has(url)) {
            console.log(`[ModelLoader] Suppression de "${url}" du cache`);
            this.cache.delete(url);
        }
    }
}
