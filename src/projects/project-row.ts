import type { Project } from "./project.js";

export interface ProjectRow {
  id: bigint;
  name: string;
  rate_per_hour: bigint;
  currency: string;
  active: bigint;
  created_at: bigint;
}

export function projectFromRow(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    ratePerHour: row.rate_per_hour,
    currency: row.currency,
    active: row.active === 1n,
    createdAt: Number(row.created_at),
  };
}
