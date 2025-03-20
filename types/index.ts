export interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  gradeLevel: string;
  school: string;
  level: number;
  money: number;
  missions: Mission[];
  inventory: InventoryItem[];
  statistics: GameStatistics;
}

export interface Mission {
  id: number;
  title: string;
  description: string;
  reward: number;
  locked: boolean;
  completed: boolean;
  requiredMissionId?: number; // Added missing field
}

export interface InventoryItem {
  id: string;
  title: string;
  description: string;
  price?: number;
  sellPrice?: number;
  type: 'crop' | 'tree' | 'tool' | 'harvestedCrop' | 'fertilizer' | 'pesticide';
  image: number;
  quantity?: number;
}

export interface GameStatistics {
  plantsGrown: number;
  moneyEarned: number;
  missionsCompleted: number;
}

export interface PlantData {
  id: string;
  stage: number;
  type: string;
  plantedAt: Date;
  readyAt: Date;
  cropType: string;
  image: number;
  hasInfestation: boolean;
  infestationTimer?: NodeJS.Timeout;
  decayTimer?: NodeJS.Timeout;
  isFertilized: boolean;
}

export interface PlotStatus {
  isPlowed: boolean;
  isWatered: boolean;
  plant?: PlantData;
}