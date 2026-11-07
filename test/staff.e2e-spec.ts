import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Staff API', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.DB_PATH = '';
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const create = async (body: object, status = 201) => {
    const res = await request(app.getHttpServer())
      .post('/staff')
      .send(body)
      .expect(status);
    return res.body;
  };

  it('builds a hierarchy and calculates salaries', async () => {
    const sales = await create({
      name: 'Sam',
      type: 'sales',
      joinedAt: '2020-01-01',
      baseSalary: 1000,
    });
    const manager = await create({
      name: 'Maria',
      type: 'manager',
      joinedAt: '2021-01-01',
      baseSalary: 1000,
      supervisorId: sales.id,
    });
    const employee = await create({
      name: 'Eric',
      type: 'employee',
      joinedAt: '2022-01-01',
      baseSalary: 1000,
      supervisorId: manager.id,
    });

    const date = '2023-01-01';

    const e = await request(app.getHttpServer())
      .get(`/staff/${employee.id}/salary?date=${date}`)
      .expect(200);
    expect(e.body.salary).toBe(1030);

    const m = await request(app.getHttpServer())
      .get(`/staff/${manager.id}/salary?date=${date}`)
      .expect(200);
    expect(m.body.salary).toBe(1105.15);

    const s = await request(app.getHttpServer())
      .get(`/staff/${sales.id}/salary?date=${date}`)
      .expect(200);
    expect(s.body.salary).toBe(1036.41);

    const total = await request(app.getHttpServer())
      .get(`/company/salary?date=${date}`)
      .expect(200);
    expect(total.body).toEqual({ date, count: 3, total: 3171.56 });
  });

  it('lists and fetches staff', async () => {
    const list = await request(app.getHttpServer()).get('/staff').expect(200);
    expect(list.body.length).toBeGreaterThanOrEqual(3);
    await request(app.getHttpServer())
      .get(`/staff/${list.body[0].id}`)
      .expect(200);
    await request(app.getHttpServer()).get('/staff/9999').expect(404);
  });

  it('rejects an employee as a supervisor', async () => {
    const employee = await create({
      name: 'Ed',
      type: 'employee',
      joinedAt: '2022-01-01',
      baseSalary: 1000,
    });
    await create(
      {
        name: 'Sub',
        type: 'employee',
        joinedAt: '2022-01-01',
        baseSalary: 1000,
        supervisorId: employee.id,
      },
      400,
    );
  });

  it('rejects an unknown supervisor and invalid input', async () => {
    await create(
      {
        name: 'X',
        type: 'employee',
        joinedAt: '2022-01-01',
        baseSalary: 1000,
        supervisorId: 9999,
      },
      400,
    );
    await create(
      { name: '', type: 'boss', joinedAt: 'nope', baseSalary: -5 },
      400,
    );
    await request(app.getHttpServer())
      .get('/company/salary?date=2023-13-45')
      .expect(400);
  });
});
