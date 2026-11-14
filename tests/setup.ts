import { vi, beforeEach } from 'vitest';

vi.mock('../src/app/utils/prisma', () => {
  const prismaMock = {
    user: makeModelMock(),
    banner: makeModelMock(),
    service: makeModelMock(),
    service2: makeModelMock(),
    package: makeModelMock(),
    booking: makeModelMock(),
    order: makeModelMock(),
    orderItem: makeModelMock(),
    product: makeModelMock(),
    category: makeModelMock(),
    portfolio: makeModelMock(),
    portfolioCategory: makeModelMock(),
    inquiry: makeModelMock(),
    overview: makeModelMock(),
    day: makeModelMock(),
    event: makeModelMock(),
    feature: makeModelMock(),
    payment: makeModelMock(),
    paymentMethod: makeModelMock(),
    invoice: makeModelMock(),
    siteSettings: makeModelMock(),
    photographer: makeModelMock(),
    bookingAssignment: makeModelMock(),
    bookingExpense: makeModelMock(),
    staff: makeModelMock(),
    financeCategory: makeModelMock(),
    recurringExpense: makeModelMock(),
    expense: makeModelMock(),
    income: makeModelMock(),
    discount: makeModelMock(),
    discountService: makeModelMock(),
    bookingDiscount: makeModelMock(),
    $transaction: vi.fn(async (arg: any) => {
      if (typeof arg === 'function') return arg(prismaMock);
      if (Array.isArray(arg)) return Promise.all(arg);
      return arg;
    }),
  };
  return { default: prismaMock };
});

vi.mock('../src/app/config', () => ({
  default: {
    jwt_access_token_secret: 'test-secret',
    jwt_refresh_token_secret: 'test-refresh-secret',
    jwt_access_token_expire_in: '1h',
    jwt_refresh_token_expire_in: '7d',
    NODE_ENV: 'test',
    port: 9000,
  },
}));

function makeModelMock() {
  return {
    create: vi.fn(),
    createMany: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    aggregate: vi.fn(),
    groupBy: vi.fn(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});
