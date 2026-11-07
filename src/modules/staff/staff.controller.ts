import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from "@nestjs/common";
import { CreateStaffDto } from "./dto/create-staff.dto";
import { StaffService } from "./staff.service";

function resolveDate(value?: string): string {
  if (value === undefined) {
    return new Date().toISOString().slice(0, 10);
  }
  const valid =
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value;
  if (!valid) {
    throw new BadRequestException("date must be a valid YYYY-MM-DD");
  }
  return value;
}

@Controller()
export class StaffController {
  constructor(private readonly service: StaffService) {}

  @Post("staff")
  create(@Body() dto: CreateStaffDto) {
    return this.service.create(dto);
  }

  @Get("staff")
  findAll() {
    return this.service.findAll();
  }

  @Get("staff/:id")
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.service.findOne(id);
  }

  @Get("staff/:id/salary")
  salary(@Param("id", ParseIntPipe) id: number, @Query("date") date?: string) {
    return this.service.salaryOf(id, resolveDate(date));
  }

  @Get("company/salary")
  companyTotal(@Query("date") date?: string) {
    return this.service.companyTotal(resolveDate(date));
  }
}
