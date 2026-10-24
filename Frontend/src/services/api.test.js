import api, { getDefaultBaseUrl } from './api';

describe('API base URL', () => {
  it('uses the explicit environment URL when provided', () => {
    process.env.REACT_APP_API_URL = 'https://example.test/api';
    expect(getDefaultBaseUrl()).toBe('https://example.test/api');
  });

  it('falls back to the local backend URL in development', () => {
    delete process.env.REACT_APP_API_URL;
    Object.defineProperty(window, 'location', {
      value: { hostname: 'localhost' },
      writable: true
    });
    expect(getDefaultBaseUrl()).toBe('http://localhost:5000/api');
  });

  it('injects the stored auth token into requests when the header is missing', () => {
    localStorage.setItem('pfaToken', 'stored-token');
    const requestInterceptor = api.interceptors.request.handlers[0]?.fulfilled;
    const config = { headers: {} };

    const interceptedConfig = requestInterceptor(config);

    expect(interceptedConfig.headers.Authorization).toBe('Bearer stored-token');
  });
});
