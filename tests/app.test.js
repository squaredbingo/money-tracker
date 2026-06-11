const request = require('supertest');
const app = require('../src/app');

describe('Application', () => {
  it('serves the dashboard on root route', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.text).toContain('<!DOCTYPE html>');
    expect(response.text).toContain('Analytics');
  });
});
