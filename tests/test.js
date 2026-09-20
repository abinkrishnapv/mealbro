const request = require('supertest');
const app = require('../src/app');

const { User } = require('../src/models');
const { sequelize } = require('../src/config/database');

describe('MealBro ledger', () => {
  let user;

  beforeAll(async () => {
    user = await User.create({
      name: 'John',
      email: `john-${Date.now()}@test.com`,
      timezone: 'America/Toronto',
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  test('records cash for a user', async () => {
    const response = await request(app)
      .post(`/api/driver/customers/${user.id}/cash`)
      .send({
        amount: 100,
        collectedAt: new Date().toISOString(),
      });

    expect(response.statusCode).toBe(201);

    expect(response.body).toHaveProperty('paymentId');
    expect(response.body.amount).toBe(100);
  });
});