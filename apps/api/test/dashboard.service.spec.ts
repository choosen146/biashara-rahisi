import { DashboardService } from '../src/dashboard/dashboard.service';

describe('DashboardService', () => {
  it('returns tenant-scoped indicators', async () => {
    const prisma: any = {
      sale: { aggregate: jest.fn().mockResolvedValue({ _sum: { total: '120000' } }) },
      expense: { aggregate: jest.fn().mockResolvedValue({ _sum: { amount: '20000' } }) },
      customer: { count: jest.fn().mockResolvedValue(4) },
      product: { count: jest.fn().mockResolvedValue(9) },
    };
    const result = await new DashboardService(prisma).summary('org-a');
    expect(result).toEqual({ revenue: '120000', expenses: '20000', customers: 4, products: 9, currency: 'TZS' });
    expect(prisma.sale.aggregate).toHaveBeenCalledWith({ where: { organizationId: 'org-a' }, _sum: { total: true } });
  });

  it('fills six EAT months, zero-filling gaps, and merges recent activity newest first', async () => {
    const prisma: any = {
      $queryRaw: jest
        .fn()
        .mockResolvedValueOnce([{ month: '2026-11', total: '5000.00' }])
        .mockResolvedValueOnce([{ month: '2026-09', total: '1200.00' }]),
      sale: {
        findMany: jest.fn().mockResolvedValue([
          { id: 's1', total: '5000.00', paymentStatus: 'PAID', createdAt: new Date('2026-11-10T08:00:00Z'), customer: { name: 'Juma' } },
        ]),
      },
      expense: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'e1', amount: '1200.00', category: 'Rent', createdAt: new Date('2026-11-11T08:00:00Z') },
        ]),
      },
    };
    // 22:00 UTC on 31 Oct is already 1 Nov in Dar es Salaam.
    const result = await new DashboardService(prisma).trends('org-a', 6, new Date('2026-10-31T22:00:00Z'));

    expect(result.series.map((p) => p.month)).toEqual(['2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11']);
    expect(result.series[5]).toEqual({ month: '2026-11', revenue: '5000.00', expenses: '0' });
    expect(result.series[3]).toEqual({ month: '2026-09', revenue: '0', expenses: '1200.00' });
    expect(result.activity.map((a) => a.id)).toEqual(['e1', 's1']);
    expect(prisma.sale.findMany.mock.calls[0][0].where).toEqual({ organizationId: 'org-a' });
  });
});
