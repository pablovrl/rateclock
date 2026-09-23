export interface Project {
  id: bigint;
  name: string;
  ratePerHour: bigint;
  currency: string;
  active: boolean;
  createdAt: number;
}
