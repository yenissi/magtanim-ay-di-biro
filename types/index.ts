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
  }
  
  export interface InventoryItem {
    id: number;
    title: string;
    description: string;
    price: number;
    type: string;
  }
  
  export interface GameStatistics {
    plantsGrown: number;
    moneyEarned: number;
    missionsCompleted: number;
  }
  