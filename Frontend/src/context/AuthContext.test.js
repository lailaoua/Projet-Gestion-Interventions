import { normalizeAuthPayload } from './AuthContext';

describe('normalizeAuthPayload', () => {
  it('normalizes backend auth payload with PascalCase user fields', () => {
    const payload = {
      token: 'abc123',
      user: {
        Id: 1,
        FullName: 'Jane Doe',
        Email: 'jane@example.com',
        Role: 'Admin'
      }
    };

    const normalized = normalizeAuthPayload(payload);

    expect(normalized.token).toBe('abc123');
    expect(normalized.user).toMatchObject({
      id: 1,
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      role: 'Admin'
    });
  });
});
