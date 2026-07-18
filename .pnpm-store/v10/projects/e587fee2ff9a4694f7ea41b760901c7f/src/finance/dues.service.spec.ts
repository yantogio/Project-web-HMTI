import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { DuesService } from './dues.service';

describe('DuesService', () => {
  let service: DuesService;
  let prisma: any;

  beforeEach(() => {
    prisma = {
      member: {
        findUnique: jest.fn()
      },
      dues: {
        findMany: jest.fn()
      }
    };

    service = new DuesService(prisma);
  });

  it('returns arrears summary for active members with unpaid dues', async () => {
    prisma.member.findUnique.mockResolvedValue({ status: 'Aktif' });
    prisma.dues.findMany.mockResolvedValue([
      { period: '2026-01', amountDue: 100, amountPaid: 40, creditBalance: 0, status: 'PARTIAL' },
      { period: '2026-02', amountDue: 100, amountPaid: 100, creditBalance: 0, status: 'PAID' }
    ]);

    const result = await service.getMemberArrears('M001');

    expect(result).toEqual(expect.objectContaining({
      hasArrears: true,
      unpaidMonths: 1,
      totalRemaining: 60,
      periods: ['2026-01']
    }));
  });

  it('returns no arrears for non-active members', async () => {
    prisma.member.findUnique.mockResolvedValue({ status: 'Alumni' });
    prisma.dues.findMany.mockResolvedValue([]);

    const result = await service.getMemberArrears('M001');

    expect(result).toEqual(expect.objectContaining({
      hasArrears: false,
      unpaidMonths: 0,
      totalRemaining: 0,
      periods: []
    }));
  });
});
