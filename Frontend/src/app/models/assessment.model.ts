export enum FarmCondition {
  Good = 0,
  Moderate = 1,
  Bad = 2
}

export interface Assessment {
  id?: string; // Guid
  latitude: number;
  longitude: number;
  farmName: string;
  address: string;
  condition: FarmCondition;
  totalChickens: number;
  photosBase64?: string[];
  isSynced: boolean;
  conditionComments?: string;
  livestockNotes?: string;
  waterAccess?: boolean;
  perimeterFence?: boolean;
  ventilation?: boolean;
  createdDate: string;
  lastModifiedDate: string;
}
