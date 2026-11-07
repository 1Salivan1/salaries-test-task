import { mkdirSync } from "fs";
import { dirname } from "path";
import { Module, ValidationPipe } from "@nestjs/common";
import { APP_PIPE } from "@nestjs/core";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StaffModule } from "./modules/staff/staff.module";
import { Staff } from "./modules/staff/entity/staff.entity";

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const location = process.env.DB_PATH ?? "data/staff.sqlite";
        if (location) {
          mkdirSync(dirname(location), { recursive: true });
        }
        return {
          type: "sqljs" as const,
          ...(location ? { location, autoSave: true } : {}),
          entities: [Staff],
          synchronize: true,
        };
      },
    }),
    StaffModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({ whitelist: true, transform: true }),
    },
  ],
})
export class AppModule {}
