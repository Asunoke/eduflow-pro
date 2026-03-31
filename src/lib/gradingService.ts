import { Grade, GradingConfig, Subject, BulletinData, Student, Period, CalculationConfig } from '@/types';

export const gradingService = {
  /**
   * Arrondi personnalisé d'un nombre à n décimales
   */
  round: (value: number, decimals: number = 2): number => {
    return Number(Math.round(Number(value + 'e' + decimals)) + 'e-' + decimals);
  },

  /**
   * Calcule la moyenne d'une matière pour un élève
   */
  calculateSubjectAverage: (grades: Grade[], config?: GradingConfig, calcConfig?: CalculationConfig) => {
    // Fallback config if undefined
    const cfg = config || {
      weights: { homework: 1, test: 1, exam: 2, oral: 1, project: 1 },
      calculationMethod: 'weighted',
      roundDecimals: 2,
      includeAbsenceAsZero: true
    } as GradingConfig;

    const cConfig = calcConfig || {
      mode: 'normalized',
      weights: { devoir: 1, composition: 2 },
      normalizeBase: { devoir: 20, composition: 40 }
    } as CalculationConfig;

    if (grades.length === 0) return { homeworkAvg: 0, examAvg: 0, totalAvg: 0 };

    // Filtre les notes selon les absences si configuré
    const validGrades = cfg.includeAbsenceAsZero ? grades : grades.filter(g => g.value !== null);
    
    // Séparation Devoirs (tout sauf examen) et Composition (examen)
    const homeworkGrades = validGrades.filter(g => g.type !== 'exam');
    const examGrades = validGrades.filter(g => g.type === 'exam');

    let homeworkAvg = 0;
    let examAvg = 0;
    let totalAvg = 0;

    if (cConfig.mode === 'direct') {
      // MODE DIRECT : (Moyenne_Devoirs + Moyenne_Compo) / 3 sans normalisation
      // On somme brutalement les valeurs. Habituellement exam sur 40, devoir sur 20
      homeworkAvg = homeworkGrades.length > 0 
        ? homeworkGrades.reduce((sum, g) => sum + g.value, 0) / homeworkGrades.length 
        : 0;
        
      examAvg = examGrades.length > 0
        ? examGrades.reduce((sum, g) => sum + g.value, 0) / examGrades.length
        : 0;
        
      // Si une partie manque, on ajuste
      if (homeworkGrades.length === 0 && examGrades.length > 0) {
        totalAvg = examAvg / 2; // Si compos seulement, on ramene sur 20
      } else if (homeworkGrades.length > 0 && examGrades.length === 0) {
        totalAvg = homeworkAvg;
      } else {
        totalAvg = (homeworkAvg + examAvg) / 3;
      }
    } else {
      // MODE NORMALISÉ : Toutes les notes ramenées sur 20, puis pondérées
      const getNormalizedAvg = (list: Grade[], base: number) => {
        if (list.length === 0) return 0;
        // La note est d'abord ramenée sur 20 à partir de g.maxValue (qui par défaut est la base)
        return list.reduce((sum, g) => sum + (g.value / (g.maxValue || base)) * 20, 0) / list.length;
      };

      homeworkAvg = getNormalizedAvg(homeworkGrades, cConfig.normalizeBase?.devoir || 20);
      examAvg = getNormalizedAvg(examGrades, cConfig.normalizeBase?.composition || 20);

      if (homeworkGrades.length === 0 && examGrades.length > 0) {
        totalAvg = examAvg;
      } else if (homeworkGrades.length > 0 && examGrades.length === 0) {
        totalAvg = homeworkAvg;
      } else {
        const hWeight = cConfig.weights?.devoir || 1;
        const eWeight = cConfig.weights?.composition || 2;
        totalAvg = (homeworkAvg * hWeight + examAvg * eWeight) / (hWeight + eWeight);
      }
    }

    return {
      homeworkAvg: gradingService.round(homeworkAvg, cfg.roundDecimals),
      examAvg: gradingService.round(examAvg, cfg.roundDecimals),
      totalAvg: gradingService.round(totalAvg, cfg.roundDecimals)
    };
  },

  /**
   * Calcule la moyenne générale d'une période basée sur les coefficients
   */
  calculatePeriodAverage: (subjectAverages: { average: number, coefficient: number }[], config?: GradingConfig) => {
    const decimals = config?.roundDecimals ?? 2;
    const totalPoints = subjectAverages.reduce((sum, s) => sum + (s.average * s.coefficient), 0);
    const totalCoeffs = subjectAverages.reduce((sum, s) => sum + s.coefficient, 0);
    
    if (totalCoeffs === 0) return 0;
    return gradingService.round(totalPoints / totalCoeffs, decimals);
  },

  /**
   * Génère les appréciations automatiques
   */
  getAppreciation: (average: number): string => {
    if (average >= 16) return 'Excellent';
    if (average >= 14) return 'Très Bien';
    if (average >= 12) return 'Bien';
    if (average >= 10) return 'Passable';
    return 'Insuffisant';
  },

  /**
   * Retourne la mention basée sur la moyenne
   */
  getMention: (average: number): string => {
    if (average >= 16) return 'Très Bien';
    if (average >= 14) return 'Bien';
    if (average >= 12) return 'Assez Bien';
    if (average >= 10) return 'Passable';
    return 'Médiocre';
  },

  /**
   * Calcul de la décision académique (T3 uniquement)
   */
  getDecision: (average: number, periodName: string): 'admis' | 'redouble' | undefined => {
    // On ne met la décision que si c'est le 3ème trimestre ou une période annuelle
    const isEndYear = periodName.toLowerCase().includes('3') || periodName.toLowerCase().includes('annuel');
    if (!isEndYear) return undefined;
    
    return average >= 10 ? 'admis' : 'redouble';
  },

  /**
   * Classe une liste d'élèves par moyenne décroissante
   */
  rankStudents: <T extends { overallAverage: number }>(data: T[]): T[] => {
    const sorted = [...data].sort((a, b) => b.overallAverage - a.overallAverage);
    return sorted.map((item, index) => ({
      ...item,
      classRank: index + 1
    }));
  },

  /**
   * Calcule la moyenne annuelle (Exemple de config: [1, 1, 1] ou moyenne average)
   */
  calculateAnnualAverage: (periodAverages: number[], config: GradingConfig) => {
    if (periodAverages.length === 0) return 0;
    
    if (config.annualMethod === 'average' || !config.annualWeights) {
      return gradingService.round(
        periodAverages.reduce((a, b) => a + b, 0) / periodAverages.length, 
        config.roundDecimals ?? 2
      );
    }

    let totalWeight = 0;
    let weightedSum = 0;
    
    periodAverages.forEach((avg, i) => {
      const weight = config.annualWeights![i] || 1;
      weightedSum += avg * weight;
      totalWeight += weight;
    });

    return gradingService.round(weightedSum / totalWeight, config.roundDecimals);
  }
};
