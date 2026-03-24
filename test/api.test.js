const request = require('supertest');
const app = require('../server/index');

describe('AI API Endpoints', () => {
  describe('POST /api/ai/generate', () => {
    it('should return 400 for missing prompt', async () => {
      const response = await request(app)
        .post('/api/ai/generate')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('Valid prompt is required');
    });

    it('should return 400 for empty prompt', async () => {
      const response = await request(app)
        .post('/api/ai/generate')
        .send({ prompt: '' })
        .expect(400);

      expect(response.body.error).toBe('Valid prompt is required');
    });

    it('should return 400 for too long prompt', async () => {
      const longPrompt = 'a'.repeat(1001);
      const response = await request(app)
        .post('/api/ai/generate')
        .send({ prompt: longPrompt })
        .expect(400);

      expect(response.body.error).toBe('Prompt too long (max 1000 characters)');
    });

    it('should return mock response when no API keys configured', async () => {
      const response = await request(app)
        .post('/api/ai/generate')
        .send({ prompt: 'A beautiful sunset' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.title).toContain('A beautiful sunset');
    });
  });

  describe('GET /api/health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.services).toBeDefined();
    });
  });
});
