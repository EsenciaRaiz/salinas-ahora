export const departments: string[];
export function coverageOf(business: { descripcion?: string }): { country: boolean; regions: string[]; description: string; label: string };
export function servesDepartment(business: { descripcion?: string }, department: string): boolean;
export function withCoverage(description: string, mode: string, regions: string[]): string;
