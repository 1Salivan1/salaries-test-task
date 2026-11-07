import { StaffType } from "src/types/types";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Staff {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "varchar" })
  type: StaffType;

  @Column({ type: "varchar" })
  joinedAt: string;

  @Column({ type: "float" })
  baseSalary: number;

  @Column({ type: "integer", nullable: true })
  supervisorId: number | null;
}
