import { StaffType } from "src/types/types";

export interface StaffNode {
  id: number;
  type: StaffType;
  joinedAt: string;
  baseSalary: number;
  supervisorId: number | null;
}

const RULES = {
  employee: { yearly: 0.03, cap: 0.3 },
  manager: { yearly: 0.05, cap: 0.4 },
  sales: { yearly: 0.01, cap: 0.35 },
};

const MANAGER_SUBORDINATE_RATE = 0.005;
const SALES_SUBORDINATE_RATE = 0.003;

export function fullYears(joinedAt: string, at: string): number {
  const [jy, jm, jd] = joinedAt.split("-").map(Number);
  const [ay, am, ad] = at.split("-").map(Number);
  let years = ay - jy;
  if (am < jm || (am === jm && ad < jd)) {
    years -= 1;
  }
  return Math.max(0, years);
}

export function computeSalaries(
  staff: StaffNode[],
  at: string,
): Map<number, number> {
  const active = staff.filter((s) => s.joinedAt <= at);

  const children = new Map<number, StaffNode[]>();
  for (const member of active) {
    if (member.supervisorId !== null) {
      const list = children.get(member.supervisorId) ?? [];
      list.push(member);
      children.set(member.supervisorId, list);
    }
  }

  const salaries = new Map<number, number>();
  const subtreeSums = new Map<number, number>();

  const subtreeSum = (member: StaffNode): number => {
    const cached = subtreeSums.get(member.id);
    if (cached !== undefined) return cached;
    let sum = 0;
    for (const child of children.get(member.id) ?? []) {
      sum += salaryOf(child) + subtreeSum(child);
    }
    subtreeSums.set(member.id, sum);
    return sum;
  };

  const salaryOf = (member: StaffNode): number => {
    const cached = salaries.get(member.id);
    if (cached !== undefined) return cached;

    const rule = RULES[member.type];
    const years = fullYears(member.joinedAt, at);
    let salary =
      member.baseSalary * (1 + Math.min(years * rule.yearly, rule.cap));

    const subordinates = children.get(member.id) ?? [];
    if (member.type === "manager") {
      const direct = subordinates.reduce((acc, s) => acc + salaryOf(s), 0);
      salary += MANAGER_SUBORDINATE_RATE * direct;
    } else if (member.type === "sales") {
      salary += SALES_SUBORDINATE_RATE * subtreeSum(member);
    }

    salaries.set(member.id, salary);
    return salary;
  };

  for (const member of active) {
    salaryOf(member);
  }
  return salaries;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
