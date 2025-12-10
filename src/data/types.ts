/**
 * Configuration du moteur 3D
 */
export interface EngineConfig {
    /** Élément HTML où afficher le canvas (défaut: document.body) */
    container?: HTMLElement;
    /** Activer les stats de performance (défaut: false) */
    debug?: boolean;
}

/**
 * Données d'une période du CV (venant de l'API)
 */
export interface Periode {
    id: string;
    titre: string;
    lieu: string;
    dates: {
        debut: string;
        fin: string;
    };
    description: string;
    projets: Projet[];
    competences: string[];
}

/**
 * Données d'un projet
 */
export interface Projet {
    nom: string;
    description: string;
    technos: string[];
}

/**
 * Données complètes du CV
 */
export interface CVData {
    periodes: Periode[];
}
