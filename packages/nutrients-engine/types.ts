export type IonKey = 'N_NO3'|'N_NH4'|'P'|'K'|'Ca'|'Mg'|'S'|'Fe'|'Mn'|'B'|'Zn'|'Cu'|'Mo';

export type TargetPPM = Partial<Record<IonKey, number>>;

export type PlanParams = {
  cropNameOrKey: string;          // "상추" 같은 이름도 허용
  stage?: string;                 // 기본 'vegetative'
  targetVolumeL?: number;         // 기본 100
  targetEC?: number | null;
  targetPH?: number | null;
  waterProfileName?: string;      // 기본 'RO_Default'
  allowSalts?: string[];          // salts.name 기준
  forbidSalts?: string[];
};

export type PlanLine = { salt: string; grams: number; tank: 'A'|'B'|'none' };
export type PlanResult = {
  cropKey: string;
  stage: string;
  target: { volumeL: number; EC: number|null; pH: number|null };
  lines: PlanLine[];
  adjustments: { reagent: string; ml: number; rationale?: string }[];
  qc: { ec_est: number|null; ph_est: number|null; warnings: string[] };
};
