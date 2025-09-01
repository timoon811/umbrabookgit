import {
  loginSchema,
  registerSchema,
  userUpdateSchema,
  depositCreateSchema,
  salaryRequestCreateSchema,
  walletCreateSchema,
  validateSchema,
} from '../zod-schemas';

describe('Zod Schemas', () => {
  describe('loginSchema', () => {
    it('validates correct login data', () => {
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = validateSchema(loginSchema, validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('test@example.com');
        expect(result.data.password).toBe('password123');
      }
    });

    it('rejects invalid email', () => {
      const invalidData = {
        email: 'invalid-email',
        password: 'password123',
      };

      const result = validateSchema(loginSchema, invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.email).toContain('Некорректный формат email');
      }
    });

    it('requires password', () => {
      const invalidData = {
        email: 'test@example.com',
      };

      const result = validateSchema(loginSchema, invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('validates correct registration data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        telegram: '@johndoe',
      };

      const result = validateSchema(registerSchema, validData);
      expect(result.success).toBe(true);
    });

    it('rejects when passwords do not match', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'different123',
        telegram: '@johndoe',
      };

      const result = validateSchema(registerSchema, invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.confirmPassword).toContain('Пароли не совпадают');
      }
    });

    it('validates telegram format', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        telegram: 'invalid-telegram',
      };

      const result = validateSchema(registerSchema, invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.telegram).toBeDefined();
      }
    });

    it('validates password strength', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'weak',
        confirmPassword: 'weak',
        telegram: '@johndoe',
      };

      const result = validateSchema(registerSchema, invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('depositCreateSchema', () => {
    it('validates correct deposit data', () => {
      const validData = {
        amount: 100.50,
        currency: 'USD',
        playerEmail: 'player@example.com',
        playerName: 'Player Name',
        transactionId: 'tx123456',
        notes: 'Test deposit',
      };

      const result = validateSchema(depositCreateSchema, validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currency).toBe('USD'); // Should be uppercase
      }
    });

    it('rejects negative amount', () => {
      const invalidData = {
        amount: -50,
        currency: 'USD',
        playerEmail: 'player@example.com',
      };

      const result = validateSchema(depositCreateSchema, invalidData);
      expect(result.success).toBe(false);
    });

    it('converts currency to uppercase', () => {
      const validData = {
        amount: 100,
        currency: 'usd',
        playerEmail: 'player@example.com',
      };

      const result = validateSchema(depositCreateSchema, validData);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.currency).toBe('USD');
      }
    });
  });

  describe('salaryRequestCreateSchema', () => {
    it('validates correct salary request data', () => {
      const validData = {
        periodStart: '2024-01-01',
        periodEnd: '2024-01-31',
        requestedAmount: 1000,
        paymentDetails: {
          method: 'bank' as const,
          details: 'Account: 1234567890',
        },
        comment: 'Monthly salary request',
      };

      const result = validateSchema(salaryRequestCreateSchema, validData);
      expect(result.success).toBe(true);
    });

    it('rejects when end date is before start date', () => {
      const invalidData = {
        periodStart: '2024-01-31',
        periodEnd: '2024-01-01',
      };

      const result = validateSchema(salaryRequestCreateSchema, invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.periodEnd).toContain('Дата начала должна быть раньше даты окончания');
      }
    });
  });

  describe('walletCreateSchema', () => {
    it('validates correct wallet data', () => {
      const validData = {
        network: 'BTC' as const,
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        label: 'Main BTC wallet',
      };

      const result = validateSchema(walletCreateSchema, validData);
      expect(result.success).toBe(true);
    });

    it('rejects unsupported network', () => {
      const invalidData = {
        network: 'INVALID',
        address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
      };

      const result = validateSchema(walletCreateSchema, invalidData);
      expect(result.success).toBe(false);
    });

    it('validates address length', () => {
      const invalidData = {
        network: 'BTC' as const,
        address: 'too-short',
      };

      const result = validateSchema(walletCreateSchema, invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errors.address).toContain('слишком короткий');
      }
    });
  });

  describe('validateSchema utility', () => {
    it('returns success for valid data', () => {
      const schema = loginSchema;
      const validData = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = validateSchema(schema, validData);
      expect(result.success).toBe(true);
      expect('data' in result).toBe(true);
    });

    it('returns errors for invalid data', () => {
      const schema = loginSchema;
      const invalidData = {
        email: 'invalid',
        password: '',
      };

      const result = validateSchema(schema, invalidData);
      expect(result.success).toBe(false);
      expect('errors' in result).toBe(true);
      if (!result.success) {
        expect(Object.keys(result.errors).length).toBeGreaterThan(0);
      }
    });
  });
});
