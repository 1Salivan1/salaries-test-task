import {
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
} from "class-validator";
import { StaffType } from "src/types/types";

export class CreateStaffDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsIn(["employee", "manager", "sales"])
  type: StaffType;

  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: "joinedAt must be YYYY-MM-DD" })
  @IsISO8601({ strict: true })
  joinedAt: string;

  @IsNumber()
  @IsPositive()
  baseSalary: number;

  @IsOptional()
  @IsInt()
  supervisorId?: number | null;
}
