import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('BusinessDayController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('/business-days/calculate (GET)', () => {
    it('should return calculated date when adding days', () => {
      return request(app.getHttpServer())
        .get('/business-days/calculate')
        .query({ days: 5 })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('date');
          expect(typeof res.body.date).toBe('string');
          expect(res.body.date).toMatch(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          );
        });
    });

    it('should return calculated date when adding hours', () => {
      return request(app.getHttpServer())
        .get('/business-days/calculate')
        .query({ hours: 8 })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('date');
          expect(typeof res.body.date).toBe('string');
          expect(res.body.date).toMatch(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          );
        });
    });

    it('should return calculated date when adding both days and hours', () => {
      return request(app.getHttpServer())
        .get('/business-days/calculate')
        .query({ days: 2, hours: 4 })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('date');
          expect(typeof res.body.date).toBe('string');
          expect(res.body.date).toMatch(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          );
        });
    });

    it('should work with custom start date', () => {
      return request(app.getHttpServer())
        .get('/business-days/calculate')
        .query({
          days: 1,
          date: '2025-08-01T14:00:00Z',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('date');
          expect(typeof res.body.date).toBe('string');
          expect(res.body.date).toMatch(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          );
        });
    });

    it('should return error when no parameters provided', () => {
      return request(app.getHttpServer())
        .get('/business-days/calculate')
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('error');
          expect(res.body).toHaveProperty('message');
          expect(res.body.error).toBe('InvalidParameters');
        });
    });

    it('should return error for invalid days parameter', () => {
      return request(app.getHttpServer())
        .get('/business-days/calculate')
        .query({ days: -1 })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('error');
          expect(res.body).toHaveProperty('message');
          expect(res.body.error).toBe('InvalidParameters');
        });
    });

    it('should return error for invalid hours parameter', () => {
      return request(app.getHttpServer())
        .get('/business-days/calculate')
        .query({ hours: 0 })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('error');
          expect(res.body).toHaveProperty('message');
          expect(res.body.error).toBe('InvalidParameters');
        });
    });

    it('should return error for invalid date format', () => {
      return request(app.getHttpServer())
        .get('/business-days/calculate')
        .query({
          days: 1,
          date: '2025-08-01T14:00:00', // Missing Z
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('error');
          expect(res.body).toHaveProperty('message');
          expect(res.body.error).toBe('InvalidParameters');
        });
    });

    it('should return error for non-integer days', () => {
      return request(app.getHttpServer())
        .get('/business-days/calculate')
        .query({ days: 'invalid' })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('error');
          expect(res.body).toHaveProperty('message');
          expect(res.body.error).toBe('InvalidParameters');
        });
    });

    it('should return error when days invalid but hours valid', () => {
      return request(app.getHttpServer())
        .get('/business-days/calculate')
        .query({ days: 'j', hours: 4 })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('error');
          expect(res.body.error).toBe('InvalidParameters');
        });
    });

    it('should return error when hours invalid but days valid', () => {
      return request(app.getHttpServer())
        .get('/business-days/calculate')
        .query({ days: 5, hours: 'h' })
        .expect(400)
        .expect((res) => {
          expect(res.body).toHaveProperty('error');
          expect(res.body.error).toBe('InvalidParameters');
        });
    });
  });
});
