import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

/** Tanzania (EAT) is a fixed UTC+3 offset with no daylight saving. */
const EAT_OFFSET_MS = 3 * 60 * 60 * 1000;

export interface MonthPoint {
  month: string; // YYYY-MM in East Africa Time
  revenue: string;
  expenses: string;
}

export interface ActivityItem {
  id: string;
  kind: 'sale' | 'expense';
  label: string;
  amount: string;
  status?: string;
  at: string;
}

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async summary(organizationId: string) {
    const [sales, expenses, customers, products] = await Promise.all([
      this.prisma.sale.aggregate({ where: { organizationId }, _sum: { total: true } }),
      this.prisma.expense.aggregate({ where: { organizationId }, _sum: { amount: true } }),
      this.prisma.customer.count({ where: { organizationId } }),
      this.prisma.product.count({ where: { organizationId } }),
    ]);
    return {
      revenue: sales._sum.total?.toString() || '0.00',
      expenses: expenses._sum.amount?.toString() || '0.00',
      customers,
      products,
      currency: 'TZS',
    };
  }

  /** Monthly revenue/expense totals for the last `months` months (EAT), plus recent activity. */
  async trends(organizationId: string, months = 6, now = new Date()) {
    const local = new Date(now.getTime() + EAT_OFFSET_MS);
    const keys: string[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth() - i, 1));
      keys.push(d.toISOString().slice(0, 7));
    }
    const firstLocal = new Date(`${keys[0]}-01T00:00:00Z`);
    const start = new Date(firstLocal.getTime() - EAT_OFFSET_MS);

    const [sales, expenses, recentSales, recentExpenses] = await Promise.all([
      this.prisma.$queryRaw<{ month: string; total: string }[]>`
        SELECT to_char(date_trunc('month', ("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Africa/Dar_es_Salaam'), 'YYYY-MM') AS month,
               SUM("total")::text AS total
        FROM "Sale" WHERE "organizationId" = ${organizationId} AND "createdAt" >= ${start}
        GROUP BY 1`,
      this.prisma.$queryRaw<{ month: string; total: string }[]>`
        SELECT to_char(date_trunc('month', ("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE 'Africa/Dar_es_Salaam'), 'YYYY-MM') AS month,
               SUM("amount")::text AS total
        FROM "Expense" WHERE "organizationId" = ${organizationId} AND "createdAt" >= ${start}
        GROUP BY 1`,
      this.prisma.sale.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { id: true, total: true, paymentStatus: true, createdAt: true, customer: { select: { name: true } } },
      }),
      this.prisma.expense.findMany({
        where: { organizationId },
        orderBy: { createdAt: 'desc' },
        take: 6,
        select: { id: true, amount: true, category: true, createdAt: true },
      }),
    ]);

    const byMonth = (rows: { month: string; total: string }[]) => new Map(rows.map((r) => [r.month, String(r.total)]));
    const s = byMonth(sales);
    const e = byMonth(expenses);
    const series: MonthPoint[] = keys.map((month) => ({
      month,
      revenue: s.get(month) ?? '0',
      expenses: e.get(month) ?? '0',
    }));

    const activity: ActivityItem[] = [
      ...recentSales.map((x) => ({
        id: x.id,
        kind: 'sale' as const,
        label: x.customer?.name ?? '',
        amount: String(x.total),
        status: x.paymentStatus,
        at: x.createdAt.toISOString(),
      })),
      ...recentExpenses.map((x) => ({
        id: x.id,
        kind: 'expense' as const,
        label: x.category,
        amount: String(x.amount),
        at: x.createdAt.toISOString(),
      })),
    ]
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 6);

    return { series, activity };
  }
}
