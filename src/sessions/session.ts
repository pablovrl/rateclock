export interface Session {
  id: bigint;
  projectId: bigint;
  projectName: string;
  rateSnapshot: bigint;
  currencySnapshot: string;
  startedAt: number;
  finishedAt: number | null;
}
