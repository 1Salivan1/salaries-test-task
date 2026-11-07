import {
  computeSalaries,
  fullYears,
  round2,
  StaffNode,
} from "../salary.calculator";

const AT = "2026-01-01";

let nextId = 1;
const make = (
  type: StaffNode["type"],
  baseSalary: number,
  joinedAt: string,
  supervisorId: number | null = null,
  id: number = nextId++,
): StaffNode => ({ id, type, joinedAt, baseSalary, supervisorId });

describe("fullYears", () => {
  it("counts full years on the anniversary day", () => {
    expect(fullYears("2020-01-15", "2023-01-15")).toBe(3);
  });

  it("does not count the year one day before the anniversary", () => {
    expect(fullYears("2020-01-15", "2023-01-14")).toBe(2);
  });

  it("counts the year when the day is later in the same month", () => {
    expect(fullYears("2020-01-15", "2023-01-20")).toBe(3);
  });

  it("does not count the year when the month has not come yet", () => {
    expect(fullYears("2020-06-10", "2023-03-20")).toBe(2);
  });

  it("counts the year when the month has passed but the day is smaller", () => {
    expect(fullYears("2020-01-25", "2023-03-10")).toBe(3);
  });

  it("returns 0 on the hiring day", () => {
    expect(fullYears("2024-05-05", "2024-05-05")).toBe(0);
  });

  it("returns 0 when less than a year has passed", () => {
    expect(fullYears("2024-01-01", "2024-12-31")).toBe(0);
  });

  it("never returns negative values when the join date is in the future", () => {
    expect(fullYears("2025-01-01", "2024-01-01")).toBe(0);
    expect(fullYears("2024-06-01", "2024-03-01")).toBe(0);
  });

  it("handles February 29th correctly", () => {
    expect(fullYears("2020-02-29", "2021-02-28")).toBe(0);
    expect(fullYears("2020-02-29", "2021-03-01")).toBe(1);
    expect(fullYears("2020-02-29", "2024-02-29")).toBe(4);
  });
});

describe("round2", () => {
  it("rounds to two decimal places", () => {
    expect(round2(1.234)).toBe(1.23);
    expect(round2(1.236)).toBe(1.24);
  });

  it("keeps integers and already rounded values unchanged", () => {
    expect(round2(10)).toBe(10);
    expect(round2(10.5)).toBe(10.5);
  });

  it("rounds floating point edge cases correctly", () => {
    expect(round2(1.005)).toBe(1.01);
  });

  it("handles zero", () => {
    expect(round2(0)).toBe(0);
  });
});

describe("computeSalaries", () => {
  beforeEach(() => {
    nextId = 1;
  });

  describe("basic cases", () => {
    it("returns an empty Map for an empty staff list", () => {
      const result = computeSalaries([], AT);
      expect(result.size).toBe(0);
    });

    it("does not mutate the input array", () => {
      const staff = [make("employee", 1000, "2020-01-01")];
      const copy = JSON.parse(JSON.stringify(staff));
      computeSalaries(staff, AT);
      expect(staff).toEqual(copy);
    });
  });

  describe("date filtering", () => {
    it("excludes staff who joined after the calculation date", () => {
      const a = make("employee", 1000, "2020-01-01");
      const b = make("employee", 1000, "2027-01-01");
      const result = computeSalaries([a, b], AT);
      expect(result.has(a.id)).toBe(true);
      expect(result.has(b.id)).toBe(false);
      expect(result.size).toBe(1);
    });

    it("includes staff who joined exactly on the calculation date", () => {
      const a = make("employee", 1000, AT);
      const result = computeSalaries([a], AT);
      expect(result.get(a.id)).toBeCloseTo(1000);
    });

    it("ignores a future subordinate in the manager's bonus", () => {
      const m = make("manager", 2000, "2026-01-01");
      const future = make("employee", 1000, "2027-01-01", m.id);
      const result = computeSalaries([m, future], AT);
      expect(result.get(m.id)).toBeCloseTo(2000);
    });

    it("does not crash when the supervisor has not joined yet but the subordinate has", () => {
      const futureBoss = make("manager", 2000, "2027-01-01");
      const e = make("employee", 1000, "2020-01-01", futureBoss.id);
      const result = computeSalaries([futureBoss, e], AT);
      expect(result.has(futureBoss.id)).toBe(false);
      expect(result.get(e.id)).toBeCloseTo(1180);
    });
  });

  describe("employee", () => {
    it("gets the base salary with no seniority", () => {
      const e = make("employee", 1000, AT);
      expect(computeSalaries([e], AT).get(e.id)).toBeCloseTo(1000);
    });

    it("gets a 3% raise for each full year", () => {
      const e = make("employee", 1000, "2020-01-01");
      expect(computeSalaries([e], AT).get(e.id)).toBeCloseTo(1180);
    });

    it("does not count an incomplete year", () => {
      const e = make("employee", 1000, "2020-06-01");
      expect(computeSalaries([e], AT).get(e.id)).toBeCloseTo(1150);
    });

    it("caps the seniority raise at 30%", () => {
      const e = make("employee", 1000, "2000-01-01");
      expect(computeSalaries([e], AT).get(e.id)).toBeCloseTo(1300);
    });

    it("gets no bonus for subordinates", () => {
      const boss = make("employee", 1000, AT);
      const sub = make("employee", 1000, AT, boss.id);
      const result = computeSalaries([boss, sub], AT);
      expect(result.get(boss.id)).toBeCloseTo(1000);
    });
  });

  describe("manager", () => {
    it("gets the base salary with no seniority and no subordinates", () => {
      const m = make("manager", 2000, AT);
      expect(computeSalaries([m], AT).get(m.id)).toBeCloseTo(2000);
    });

    it("gets a 5% raise for each full year", () => {
      const m = make("manager", 2000, "2021-01-01");
      expect(computeSalaries([m], AT).get(m.id)).toBeCloseTo(2500);
    });

    it("caps the seniority raise at 40%", () => {
      const m = make("manager", 2000, "2006-01-01");
      expect(computeSalaries([m], AT).get(m.id)).toBeCloseTo(2800);
    });

    it("gets 0.5% of the salaries of direct subordinates", () => {
      const m = make("manager", 2000, AT);
      const e1 = make("employee", 1000, AT, m.id);
      const e2 = make("employee", 1000, AT, m.id);
      const result = computeSalaries([m, e1, e2], AT);
      expect(result.get(m.id)).toBeCloseTo(2010);
    });

    it("ignores indirect subordinates", () => {
      const m = make("manager", 2000, AT);
      const e1 = make("employee", 1000, AT, m.id);
      const e2 = make("employee", 1000, AT, e1.id);
      const result = computeSalaries([m, e1, e2], AT);
      expect(result.get(m.id)).toBeCloseTo(2005);
      expect(result.get(e1.id)).toBeCloseTo(1000);
    });

    it("uses the subordinate's final salary (including seniority)", () => {
      const m = make("manager", 2000, "2021-01-01");
      const e = make("employee", 1000, "2020-01-01", m.id);
      const result = computeSalaries([m, e], AT);
      expect(result.get(e.id)).toBeCloseTo(1180);
      expect(result.get(m.id)).toBeCloseTo(2500 + 0.005 * 1180);
    });

    it("includes a subordinate manager's own bonus in the superior's bonus", () => {
      const m1 = make("manager", 2000, AT);
      const m2 = make("manager", 2000, AT, m1.id);
      const e = make("employee", 1000, AT, m2.id);
      const result = computeSalaries([m1, m2, e], AT);
      expect(result.get(m2.id)).toBeCloseTo(2005);
      expect(result.get(m1.id)).toBeCloseTo(2000 + 0.005 * 2005);
    });

    it("does not apply the seniority cap to the subordinate bonus", () => {
      const m = make("manager", 2000, "2006-01-01");
      const e = make("employee", 10000, AT, m.id);
      const result = computeSalaries([m, e], AT);
      expect(result.get(m.id)).toBeCloseTo(2800 + 0.005 * 10000);
    });
  });

  describe("sales", () => {
    it("gets the base salary with no seniority and no subordinates", () => {
      const s = make("sales", 1000, AT);
      expect(computeSalaries([s], AT).get(s.id)).toBeCloseTo(1000);
    });

    it("gets a 1% raise for each full year", () => {
      const s = make("sales", 1000, "2016-01-01");
      expect(computeSalaries([s], AT).get(s.id)).toBeCloseTo(1100);
    });

    it("caps the seniority raise at 35%", () => {
      const s = make("sales", 1000, "1970-01-01");
      expect(computeSalaries([s], AT).get(s.id)).toBeCloseTo(1350);
    });

    it("gets 0.3% of the salaries of the whole subtree, not only direct reports", () => {
      const s = make("sales", 1000, AT);
      const e1 = make("employee", 1000, AT, s.id);
      const e2 = make("employee", 1000, AT, e1.id);
      const result = computeSalaries([s, e1, e2], AT);
      expect(result.get(s.id)).toBeCloseTo(1006);
    });

    it("sums multiple branches of the subtree", () => {
      const s = make("sales", 1000, AT);
      const e1 = make("employee", 1000, AT, s.id);
      const e2 = make("employee", 1000, AT, s.id);
      const e3 = make("employee", 1000, AT, e1.id);
      const result = computeSalaries([s, e1, e2, e3], AT);
      expect(result.get(s.id)).toBeCloseTo(1009);
    });

    it("uses a manager's final salary in the subtree (including their bonus)", () => {
      const s = make("sales", 1000, AT);
      const m = make("manager", 2000, AT, s.id);
      const e = make("employee", 1000, AT, m.id);
      const result = computeSalaries([s, m, e], AT);
      expect(result.get(m.id)).toBeCloseTo(2005);
      expect(result.get(s.id)).toBeCloseTo(1000 + 0.003 * 3005);
    });
  });

  describe("structure and ordering", () => {
    it("does not depend on the order of elements in the input array", () => {
      const m = make("manager", 2000, "2021-01-01");
      const s = make("sales", 1500, "2019-03-10", m.id);
      const e1 = make("employee", 1000, "2020-05-05", s.id);
      const e2 = make("employee", 1100, "2022-07-07", m.id);

      const a = computeSalaries([m, s, e1, e2], AT);
      const b = computeSalaries([e2, e1, s, m], AT);

      for (const id of [m.id, s.id, e1.id, e2.id]) {
        expect(b.get(id)).toBeCloseTo(a.get(id)!);
      }
    });

    it("returns a salary for every active staff member", () => {
      const m = make("manager", 2000, AT);
      const s = make("sales", 1000, AT, m.id);
      const e = make("employee", 1000, AT, s.id);
      const result = computeSalaries([m, s, e], AT);
      expect([...result.keys()].sort()).toEqual([m.id, s.id, e.id].sort());
    });

    it("handles a deep chain of subordinates", () => {
      const depth = 500;
      const staff: StaffNode[] = [make("sales", 1000, AT, null, 1)];
      for (let i = 2; i <= depth; i++) {
        staff.push(make("employee", 1000, AT, i - 1, i));
      }
      const result = computeSalaries(staff, AT);
      expect(result.get(1)).toBeCloseTo(1000 + 0.003 * 1000 * (depth - 1));
    });

    it("combines seniority raise and subordinate bonus", () => {
      const m = make("manager", 2000, "2021-01-01");
      const e = make("employee", 1000, "2020-01-01", m.id);
      const result = computeSalaries([m, e], AT);
      expect(round2(result.get(m.id)!)).toBe(2505.9);
    });
  });
});
