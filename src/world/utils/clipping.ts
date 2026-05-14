import * as THREE from "three";

/**
 * Applique des clipping planes à tous les meshes d'un groupe.
 * Clone les matériaux pour éviter d'affecter d'autres instances.
 */
export function applyClippingPlanes(
    group: THREE.Group,
    planes: THREE.Plane[],
): void {
    group.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
            child.material = child.material.clone();
            child.material.clippingPlanes = planes;
            child.material.clipShadows = true;
            child.material.side = THREE.DoubleSide;
        }
    });
}

/**
 * Crée un plan de découpe horizontal (coupe sur Y)
 * @param height - Hauteur de la coupe
 * @param keepAbove - Si true, garde ce qui est au-dessus; sinon garde en dessous
 */
export function createHorizontalClipPlane(
    height: number,
    keepAbove: boolean,
): THREE.Plane {
    const normalY = keepAbove ? 1 : -1;
    const constant = keepAbove ? -height : height;
    return new THREE.Plane(new THREE.Vector3(0, normalY, 0), constant);
}

/**
 * Crée un plan de découpe vertical sur l'axe X
 * @param position - Position X de la coupe
 * @param keepPositive - Si true, garde X > position; sinon garde X < position
 */
export function createVerticalClipPlaneX(
    position: number,
    keepPositive: boolean,
): THREE.Plane {
    const normalX = keepPositive ? 1 : -1;
    return new THREE.Plane(
        new THREE.Vector3(normalX, 0, 0),
        -normalX * position,
    );
}

/**
 * Crée un plan de découpe vertical sur l'axe Z
 * @param position - Position Z de la coupe
 * @param keepPositive - Si true, garde Z > position; sinon garde Z < position
 */
export function createVerticalClipPlaneZ(
    position: number,
    keepPositive: boolean,
): THREE.Plane {
    const normalZ = keepPositive ? 1 : -1;
    return new THREE.Plane(
        new THREE.Vector3(0, 0, normalZ),
        -normalZ * position,
    );
}
