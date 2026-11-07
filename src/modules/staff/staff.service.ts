import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateStaffDto } from "./dto/create-staff.dto";
import { computeSalaries, round2 } from "./lib/salary.calculator";
import { Staff } from "./entity/staff.entity";

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff) private readonly repo: Repository<Staff>,
  ) {}

  async create(dto: CreateStaffDto): Promise<Staff> {
    const supervisorId = dto.supervisorId ?? null;
    if (supervisorId !== null) {
      const supervisor = await this.repo.findOneBy({ id: supervisorId });
      if (!supervisor) {
        throw new BadRequestException(`Supervisor ${supervisorId} not found`);
      }
      if (supervisor.type === "employee") {
        throw new BadRequestException("Employee cannot have subordinates");
      }
    }
    return this.repo.save(
      this.repo.create({
        name: dto.name,
        type: dto.type,
        joinedAt: dto.joinedAt,
        baseSalary: dto.baseSalary,
        supervisorId,
      }),
    );
  }

  findAll(): Promise<Staff[]> {
    return this.repo.find({ order: { id: "ASC" } });
  }

  async findOne(id: number): Promise<Staff> {
    const member = await this.repo.findOneBy({ id });
    if (!member) {
      throw new NotFoundException(`Staff member ${id} not found`);
    }
    return member;
  }

  async salaryOf(id: number, date: string) {
    const member = await this.findOne(id);
    const salaries = computeSalaries(await this.repo.find(), date);
    return {
      id: member.id,
      name: member.name,
      date,
      salary: round2(salaries.get(id) ?? 0),
    };
  }

  async companyTotal(date: string) {
    const salaries = computeSalaries(await this.repo.find(), date);
    let total = 0;
    for (const value of salaries.values()) {
      total += value;
    }
    return { date, count: salaries.size, total: round2(total) };
  }
}
