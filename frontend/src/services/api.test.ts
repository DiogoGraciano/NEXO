/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type Interceptor = {
  request: { use: (onFulfilled: (config: any) => any, onRejected?: (err: any) => any) => void };
  response: { use: (onFulfilled: (response: any) => any, onRejected?: (err: any) => any) => void };
};

const requestHandlers: Array<(config: any) => any> = [];
const requestRejecters: Array<(err: any) => any> = [];
const responseHandlers: Array<(response: any) => any> = [];
const responseRejecters: Array<(err: any) => any> = [];

const axiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: {
      use: (ok: (c: any) => any, err?: (e: any) => any) => {
        requestHandlers.push(ok);
        if (err) requestRejecters.push(err);
      },
    },
    response: {
      use: (ok: (c: any) => any, err?: (e: any) => any) => {
        responseHandlers.push(ok);
        if (err) responseRejecters.push(err);
      },
    },
  } satisfies Interceptor,
};

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => axiosInstance),
  },
}));

const clearAuthMock = vi.fn();
vi.mock('../store/authSlice', async (orig) => {
  const actual = (await orig()) as Record<string, unknown>;
  return { ...actual, clearAuth: () => ({ type: 'auth/clearAuth-mock' }) };
});

vi.mock('../store', () => ({
  store: { dispatch: (action: unknown) => clearAuthMock(action) },
}));

let apiService: typeof import('./api').default;

beforeEach(async () => {
  vi.resetModules();
  requestHandlers.length = 0;
  requestRejecters.length = 0;
  responseHandlers.length = 0;
  responseRejecters.length = 0;
  axiosInstance.get.mockReset();
  axiosInstance.post.mockReset();
  axiosInstance.put.mockReset();
  axiosInstance.delete.mockReset();
  clearAuthMock.mockReset();
  const mod = await import('./api');
  apiService = mod.default;
});

afterEach(() => {
  window.localStorage.clear();
});

const okResponse = <T>(data: T) => ({ data });

describe('axios interceptors', () => {
  it('request interceptor injects Bearer token from localStorage', () => {
    window.localStorage.setItem('token', 'abc123');
    const config = { headers: {} } as { headers: Record<string, string> };
    const result = requestHandlers[0](config);
    expect(result.headers.Authorization).toBe('Bearer abc123');
  });

  it('request interceptor leaves headers untouched when no token', () => {
    const config = { headers: {} } as { headers: Record<string, string> };
    const result = requestHandlers[0](config);
    expect(result.headers.Authorization).toBeUndefined();
  });

  it('request interceptor error handler propagates rejection', async () => {
    await expect(requestRejecters[0](new Error('boom'))).rejects.toThrow('boom');
  });

  it('response interceptor passes through successful responses', () => {
    const response = { data: { foo: 'bar' } };
    expect(responseHandlers[0](response)).toBe(response);
  });

  it('response interceptor dispatches clearAuth and redirects on 401', async () => {
    const err = { response: { status: 401 }, config: { url: '/students' } };
    await expect(responseRejecters[0](err)).rejects.toEqual(err);
    expect(clearAuthMock).toHaveBeenCalledTimes(1);
    expect(window.location.href).toBe('/login');
  });

  it('response interceptor does NOT redirect on 401 from /auth (wrong password)', async () => {
    const originalHref = window.location.href;
    const err = { response: { status: 401 }, config: { url: '/auth' } };
    await expect(responseRejecters[0](err)).rejects.toEqual(err);
    expect(clearAuthMock).not.toHaveBeenCalled();
    expect(window.location.href).toBe(originalHref);
  });

  it('response interceptor does NOT redirect for non-401 errors', async () => {
    const err = { response: { status: 500 }, config: { url: '/students' } };
    await expect(responseRejecters[0](err)).rejects.toEqual(err);
    expect(clearAuthMock).not.toHaveBeenCalled();
  });

  it('response interceptor handles errors without response', async () => {
    const err = { message: 'Network error' };
    await expect(responseRejecters[0](err)).rejects.toEqual(err);
    expect(clearAuthMock).not.toHaveBeenCalled();
  });
});

describe('auth methods', () => {
  it('login posts to /auth', async () => {
    axiosInstance.post.mockResolvedValueOnce(okResponse({ user: { id: 1 }, token: 'tk' }));
    const result = await apiService.login('e@t.com', 'pass');
    expect(axiosInstance.post).toHaveBeenCalledWith('/auth', { email: 'e@t.com', password: 'pass' });
    expect(result).toEqual({ user: { id: 1 }, token: 'tk' });
  });

  it('logout posts to /auth/logout and clears storage', async () => {
    window.localStorage.setItem('token', 'abc');
    window.localStorage.setItem('user', '{}');
    axiosInstance.post.mockResolvedValueOnce(okResponse(null));
    await apiService.logout();
    expect(axiosInstance.post).toHaveBeenCalledWith('/auth/logout');
    expect(window.localStorage.getItem('token')).toBeNull();
    expect(window.localStorage.getItem('user')).toBeNull();
  });

  it('requestPasswordReset and resetPassword', async () => {
    axiosInstance.post.mockResolvedValueOnce(okResponse(null));
    await apiService.requestPasswordReset('e@t.com');
    expect(axiosInstance.post).toHaveBeenCalledWith('/forgot-password', { email: 'e@t.com' });

    axiosInstance.post.mockResolvedValueOnce(okResponse(null));
    await apiService.resetPassword('tok', 'newpass');
    expect(axiosInstance.post).toHaveBeenLastCalledWith('/reset-password', {
      token: 'tok',
      password: 'newpass',
    });
  });
});

describe('CRUD for students', () => {
  it('list, create, update, delete', async () => {
    axiosInstance.get.mockResolvedValueOnce(okResponse([{ id: 1 }]));
    expect(await apiService.getStudents()).toEqual([{ id: 1 }]);
    expect(axiosInstance.get).toHaveBeenCalledWith('/students');

    axiosInstance.post.mockResolvedValueOnce(okResponse({}));
    await apiService.createStudent({ foo: 'bar' });
    expect(axiosInstance.post).toHaveBeenCalledWith('/students', { foo: 'bar' });

    axiosInstance.put.mockResolvedValueOnce(okResponse({}));
    await apiService.updateStudent(5, { x: 1 });
    expect(axiosInstance.put).toHaveBeenCalledWith('/students/5', { x: 1 });

    axiosInstance.delete.mockResolvedValueOnce(okResponse(undefined));
    await apiService.deleteStudent(7);
    expect(axiosInstance.delete).toHaveBeenCalledWith('/students/7');
  });
});

describe('CRUD for companies', () => {
  it('list, create, update, delete', async () => {
    axiosInstance.get.mockResolvedValueOnce(okResponse([]));
    await apiService.getCompanies();
    expect(axiosInstance.get).toHaveBeenCalledWith('/companies');

    axiosInstance.post.mockResolvedValueOnce(okResponse({}));
    await apiService.createCompany({ a: 1 });
    expect(axiosInstance.post).toHaveBeenCalledWith('/companies', { a: 1 });

    axiosInstance.put.mockResolvedValueOnce(okResponse({}));
    await apiService.updateCompany(2, { a: 2 });
    expect(axiosInstance.put).toHaveBeenCalledWith('/companies/2', { a: 2 });

    axiosInstance.delete.mockResolvedValueOnce(okResponse(undefined));
    await apiService.deleteCompany(3);
    expect(axiosInstance.delete).toHaveBeenCalledWith('/companies/3');
  });
});

describe('CRUD for employees', () => {
  it('list, create, update, delete', async () => {
    axiosInstance.get.mockResolvedValueOnce(okResponse([]));
    await apiService.getEmployees();
    expect(axiosInstance.get).toHaveBeenCalledWith('/employees');

    axiosInstance.post.mockResolvedValueOnce(okResponse({}));
    await apiService.createEmployee({ a: 1 });
    expect(axiosInstance.post).toHaveBeenCalledWith('/employees', { a: 1 });

    axiosInstance.put.mockResolvedValueOnce(okResponse({}));
    await apiService.updateEmployee(2, { a: 2 });
    expect(axiosInstance.put).toHaveBeenCalledWith('/employees/2', { a: 2 });

    axiosInstance.delete.mockResolvedValueOnce(okResponse(undefined));
    await apiService.deleteEmployee(3);
    expect(axiosInstance.delete).toHaveBeenCalledWith('/employees/3');
  });
});

describe('student detail', () => {
  it('getStudent by id', async () => {
    axiosInstance.get.mockResolvedValueOnce(okResponse({ id: 1 }));
    await apiService.getStudent(1);
    expect(axiosInstance.get).toHaveBeenCalledWith('/students/1');
  });
});

describe('functions', () => {
  it('getFunctions GETs /functions', async () => {
    axiosInstance.get.mockResolvedValueOnce(okResponse([]));
    await apiService.getFunctions();
    expect(axiosInstance.get).toHaveBeenCalledWith('/functions');
  });
});

describe('questionnaires CRUD', () => {
  it('list/create/update/delete', async () => {
    axiosInstance.get.mockResolvedValueOnce(okResponse([]));
    await apiService.getQuestionnaires();
    expect(axiosInstance.get).toHaveBeenCalledWith('/questionnaires');

    axiosInstance.post.mockResolvedValueOnce(okResponse({}));
    await apiService.createQuestionnaire({ nome: 'q' });
    expect(axiosInstance.post).toHaveBeenCalledWith('/questionnaires', { nome: 'q' });

    axiosInstance.put.mockResolvedValueOnce(okResponse({}));
    await apiService.updateQuestionnaire(3, { nome: 'q2' });
    expect(axiosInstance.put).toHaveBeenCalledWith('/questionnaires/3', { nome: 'q2' });

    axiosInstance.delete.mockResolvedValueOnce(okResponse(undefined));
    await apiService.deleteQuestionnaire(4);
    expect(axiosInstance.delete).toHaveBeenCalledWith('/questionnaires/4');
  });
});

describe('questions', () => {
  it('lists questions with and without filter', async () => {
    axiosInstance.get.mockResolvedValueOnce(okResponse([]));
    await apiService.getQuestions();
    expect(axiosInstance.get).toHaveBeenCalledWith('/questions');

    axiosInstance.get.mockResolvedValueOnce(okResponse([]));
    await apiService.getQuestions(7);
    expect(axiosInstance.get).toHaveBeenCalledWith('/questions?questionnaire_id=7');
  });

  it('creates question', async () => {
    axiosInstance.post.mockResolvedValueOnce(okResponse({}));
    await apiService.createQuestion({ texto: 't' });
    expect(axiosInstance.post).toHaveBeenCalledWith('/questions', { texto: 't' });
  });
});

describe('answers', () => {
  it('lists with filters serialized', async () => {
    axiosInstance.get.mockResolvedValueOnce(okResponse([]));
    await apiService.getAnswers({ aluno_id: '2' });
    expect(axiosInstance.get).toHaveBeenCalledWith('/answers?aluno_id=2');
  });

  it('creates answer', async () => {
    axiosInstance.post.mockResolvedValueOnce(okResponse({}));
    await apiService.createAnswer({ resposta: 'x' });
    expect(axiosInstance.post).toHaveBeenCalledWith('/answers', { resposta: 'x' });
  });
});

describe('questionnaire responses', () => {
  it('list (with and without filter)', async () => {
    axiosInstance.get.mockResolvedValueOnce(okResponse([]));
    await apiService.getQuestionnaireResponses();
    expect(axiosInstance.get).toHaveBeenCalledWith('/questionnaire-responses');

    axiosInstance.get.mockResolvedValueOnce(okResponse([]));
    await apiService.getQuestionnaireResponses(8);
    expect(axiosInstance.get).toHaveBeenCalledWith('/questionnaire-responses?questionnaire_id=8');
  });

  it('detail and create', async () => {
    axiosInstance.get.mockResolvedValueOnce(okResponse({}));
    await apiService.getQuestionnaireResponse(9);
    expect(axiosInstance.get).toHaveBeenCalledWith('/questionnaire-responses/9');

    axiosInstance.post.mockResolvedValueOnce(okResponse({}));
    await apiService.createQuestionnaireResponse({ a: 1 });
    expect(axiosInstance.post).toHaveBeenCalledWith('/questionnaire-responses', { a: 1 });
  });
});

describe('referrals', () => {
  it('list with and without filter, get, create, update, delete', async () => {
    axiosInstance.get.mockResolvedValueOnce(okResponse([]));
    await apiService.getReferrals();
    expect(axiosInstance.get).toHaveBeenCalledWith('/referrals');

    axiosInstance.get.mockResolvedValueOnce(okResponse([]));
    await apiService.getReferrals(11);
    expect(axiosInstance.get).toHaveBeenCalledWith('/referrals?aluno_id=11');

    axiosInstance.get.mockResolvedValueOnce(okResponse({}));
    await apiService.getReferral(12);
    expect(axiosInstance.get).toHaveBeenCalledWith('/referrals/12');

    axiosInstance.post.mockResolvedValueOnce(okResponse({}));
    await apiService.createReferral({ x: 1 });
    expect(axiosInstance.post).toHaveBeenCalledWith('/referrals', { x: 1 });

    axiosInstance.put.mockResolvedValueOnce(okResponse({}));
    await apiService.updateReferral(13, { y: 2 });
    expect(axiosInstance.put).toHaveBeenCalledWith('/referrals/13', { y: 2 });

    axiosInstance.delete.mockResolvedValueOnce(okResponse(undefined));
    await apiService.deleteReferral(14);
    expect(axiosInstance.delete).toHaveBeenCalledWith('/referrals/14');
  });
});

describe('events', () => {
  it('list (no filter, start only, both)', async () => {
    axiosInstance.get.mockResolvedValueOnce(okResponse([]));
    await apiService.getEvents();
    expect(axiosInstance.get).toHaveBeenCalledWith('/events');

    axiosInstance.get.mockResolvedValueOnce(okResponse([]));
    await apiService.getEvents('2026-01-01');
    expect(axiosInstance.get).toHaveBeenCalledWith('/events?start=2026-01-01');

    axiosInstance.get.mockResolvedValueOnce(okResponse([]));
    await apiService.getEvents('2026-01-01', '2026-02-01');
    expect(axiosInstance.get).toHaveBeenCalledWith(
      '/events?start=2026-01-01&end=2026-02-01',
    );
  });

  it('detail, create, update, delete', async () => {
    axiosInstance.get.mockResolvedValueOnce(okResponse({}));
    await apiService.getEvent(1);
    expect(axiosInstance.get).toHaveBeenCalledWith('/events/1');

    axiosInstance.post.mockResolvedValueOnce(okResponse({}));
    await apiService.createEvent({ a: 1 });
    expect(axiosInstance.post).toHaveBeenCalledWith('/events', { a: 1 });

    axiosInstance.put.mockResolvedValueOnce(okResponse({}));
    await apiService.updateEvent(2, { a: 2 });
    expect(axiosInstance.put).toHaveBeenCalledWith('/events/2', { a: 2 });

    axiosInstance.delete.mockResolvedValueOnce(okResponse(undefined));
    await apiService.deleteEvent(3);
    expect(axiosInstance.delete).toHaveBeenCalledWith('/events/3');
  });
});

describe('smtp config', () => {
  it('get, save, test connection', async () => {
    axiosInstance.get.mockResolvedValueOnce(okResponse({}));
    await apiService.getSmtpConfig();
    expect(axiosInstance.get).toHaveBeenCalledWith('/smtp-config');

    axiosInstance.post.mockResolvedValueOnce(okResponse({}));
    await apiService.saveSmtpConfig({ host: 'x' });
    expect(axiosInstance.post).toHaveBeenCalledWith('/smtp-config', { host: 'x' });

    axiosInstance.post.mockResolvedValueOnce(okResponse({}));
    await apiService.testSmtpConnection({ host: 'x' });
    expect(axiosInstance.post).toHaveBeenCalledWith('/smtp-config-test', { host: 'x' });
  });
});

describe('downloadReport', () => {
  it('GETs the report endpoint with blob responseType', async () => {
    const blob = new Blob(['pdf']);
    axiosInstance.get.mockResolvedValueOnce({ data: blob });
    const result = await apiService.downloadReport('students', 'all');
    expect(axiosInstance.get).toHaveBeenCalledWith('/reports/students', {
      params: { type: 'all' },
      responseType: 'blob',
    });
    expect(result).toBe(blob);
  });
});
