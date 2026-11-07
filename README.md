# Staff Salary Service

NestJS app that models company staff (Employee, Manager, Sales) and calculates salaries at an arbitrary date.

## Run

```bash
npm install
npm test
npm run build
npm run start:prod
```

The server listens on `http://localhost:3000`. Data is stored in SQLite at `data/staff.sqlite` (override with `DB_PATH`, `PORT` for the port).

## API

| Method | Path                                | Description                                   |
| ------ | ----------------------------------- | --------------------------------------------- |
| POST   | `/staff`                            | Create a staff member                         |
| GET    | `/staff`                            | List all staff                                |
| GET    | `/staff/:id`                        | Get one staff member                          |
| GET    | `/staff/:id/salary?date=YYYY-MM-DD` | Salary of a member at a date (default: today) |
| GET    | `/company/salary?date=YYYY-MM-DD`   | Total salaries of the whole company at a date |

Create body:

```json
{
  "name": "Maria",
  "type": "manager",
  "joinedAt": "2021-01-01",
  "baseSalary": 1000,
  "supervisorId": 1
}
```

`type` is `employee`, `manager` or `sales`; `supervisorId` is optional.

Example:

```bash
curl -X POST localhost:3000/staff -H 'Content-Type: application/json' \
  -d '{"name":"Sam","type":"sales","joinedAt":"2020-01-01","baseSalary":1000}'
curl "localhost:3000/staff/1/salary?date=2023-01-01"
curl "localhost:3000/company/salary?date=2023-01-01"
```
