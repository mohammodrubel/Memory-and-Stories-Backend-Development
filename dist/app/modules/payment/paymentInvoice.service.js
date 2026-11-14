"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentInvoiceService = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const puppeteer_1 = __importDefault(require("puppeteer"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const http_status_1 = __importDefault(require("http-status"));
// Embed logo as base64 data URI — survives puppeteer's standalone HTML render.
// Logo lives in apps/web/assets/logo.png; resolve from monorepo root.
const LOGO_PATH = path_1.default.resolve(process.cwd(), '..', 'web', 'assets', 'logo.png');
let LOGO_DATA_URI = '';
try {
    if (fs_1.default.existsSync(LOGO_PATH)) {
        const buf = fs_1.default.readFileSync(LOGO_PATH);
        LOGO_DATA_URI = `data:image/png;base64,${buf.toString('base64')}`;
    }
}
catch (_a) {
    /* logo optional */
}
const listMine = (userId) => prisma_1.default.invoice.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
        payment: {
            include: {
                booking: { include: { service: { select: { title: true } } } },
            },
        },
    },
});
const listAll = (opts) => __awaiter(void 0, void 0, void 0, function* () {
    const { page = 1, limit = 10, userId } = opts;
    const where = userId ? { userId } : {};
    const [data, total] = yield Promise.all([
        prisma_1.default.invoice.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { id: true, name: true, email: true } },
                payment: { include: { booking: { include: { service: true } } } },
            },
        }),
        prisma_1.default.invoice.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) || 1 } };
});
const getOne = (id, userId, isAdmin) => __awaiter(void 0, void 0, void 0, function* () {
    const inv = yield prisma_1.default.invoice.findUnique({
        where: { id },
        include: {
            user: { select: { id: true, name: true, email: true } },
            payment: {
                include: {
                    booking: { include: { service: true } },
                    paymentMethod: true,
                },
            },
        },
    });
    if (!inv)
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Invoice not found');
    if (!isAdmin && inv.userId !== userId)
        throw new AppError_1.default(http_status_1.default.FORBIDDEN, 'Not your invoice');
    return inv;
});
const esc = (s) => String(s !== null && s !== void 0 ? s : '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
const fmtBdt = (n) => `৳${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => new Date(d).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
});
const buildHtml = (inv) => {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
    const fullyPaid = !inv.isPartial;
    const statusLabel = fullyPaid ? 'PAID IN FULL' : 'PARTIALLY PAID';
    const watermarkText = fullyPaid ? 'PAID' : 'PARTIAL';
    const accentColor = fullyPaid ? '#1f7a3a' : '#b8761d';
    const accentSoftBg = fullyPaid ? '#e3f1e7' : '#fbeed8';
    const serviceTitle = esc(((_c = (_b = (_a = inv.payment) === null || _a === void 0 ? void 0 : _a.booking) === null || _b === void 0 ? void 0 : _b.service) === null || _c === void 0 ? void 0 : _c.title) || 'Photography package');
    const sessionDate = ((_e = (_d = inv.payment) === null || _d === void 0 ? void 0 : _d.booking) === null || _e === void 0 ? void 0 : _e.date)
        ? fmtDate(inv.payment.booking.date)
        : '—';
    const booking = (_f = inv.payment) === null || _f === void 0 ? void 0 : _f.booking;
    const subtotal = (_g = booking === null || booking === void 0 ? void 0 : booking.subtotal) !== null && _g !== void 0 ? _g : inv.totalAmount;
    const discountAmount = (_h = booking === null || booking === void 0 ? void 0 : booking.discountAmount) !== null && _h !== void 0 ? _h : 0;
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(inv.invoiceNo)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  @page { size: A4; margin: 0; }
  html, body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    color: #1a1a1a;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    width: 210mm;
    height: 297mm;
    padding: 0 0 100px 0;
    position: relative;
    background: #fff;
  }
  .content {
    padding-bottom: 100px;
  }
  /* watermark */
  .wm {
    position: fixed;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%) rotate(-28deg);
    font-family: 'Helvetica Neue', Arial, sans-serif;
    font-weight: 900;
    font-size: 200px;
    letter-spacing: 14px;
    color: ${accentColor};
    opacity: 0.07;
    z-index: 0;
    pointer-events: none;
    user-select: none;
    white-space: nowrap;
  }
  .content { position: relative; z-index: 2; }

  /* header */
  .accent { height: 6px; background: #c47a2c; }
  .head {
    background: #fafafa;
    padding: 30px 50px 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #ececec;
  }
  .brand {
    display: flex; align-items: center; gap: 16px;
  }
  .logo {
    width: 120px;
    height: 120px;
    object-fit: contain;
    flex-shrink: 0;
  }
  .mono-fallback {
    width: 56px; height: 56px;
    border: 1.5px solid #c47a2c;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    font-family: 'Georgia', 'Times New Roman', serif;
    font-weight: 700;
    color: #c47a2c;
    font-size: 18px;
    letter-spacing: 1px;
  }
  .mono-fallback::after {
    content: '';
    position: absolute;
    inset: 4px;
    border: 1px solid #c47a2c;
    border-radius: 50%;
  }
  .brand .name {
    font-family: 'Georgia', 'Times New Roman', serif;
    font-size: 22px;
    font-weight: 700;
    line-height: 1.1;
    color: #1a1a1a;
  }
  .brand .tag {
    font-size: 9px;
    color: #6b6b6b;
    letter-spacing: 3px;
    margin-top: 4px;
    font-style: italic;
  }
  .brand .contact {
    font-size: 8px;
    color: #888;
    margin-top: 5px;
  }
  .invoice-meta {
    text-align: right;
  }
  .invoice-meta .label {
    font-family: 'Georgia', serif;
    font-size: 30px;
    font-weight: 700;
    color: #c47a2c;
    letter-spacing: 4px;
  }
  .invoice-meta .num {
    font-size: 9px;
    color: #6b6b6b;
    margin-top: 6px;
  }

  /* billed-to + session */
  .meta-row {
    display: flex;
    justify-content: space-between;
    padding: 28px 50px 20px;
  }
  .meta-block .lbl {
    font-size: 8px;
    text-transform: uppercase;
    letter-spacing: 2px;
    color: #888;
    font-weight: 600;
    margin-bottom: 8px;
  }
  .meta-block .val {
    font-family: 'Georgia', serif;
    font-size: 15px;
    font-weight: 700;
    color: #1a1a1a;
  }
  .meta-block .sub {
    font-size: 10px;
    color: #6b6b6b;
    margin-top: 4px;
  }
  .meta-block.right {
    text-align: right;
  }

  /* items table */
  .table-wrap {
    padding: 8px 50px 0;
  }
  table {
    width: 100%;
    border-collapse: collapse;
  }
  thead th {
    background: #1a1a1a;
    color: #fff;
    text-align: left;
    padding: 10px 14px;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    font-weight: 600;
  }
  thead th.right { text-align: right; }
  tbody td {
    padding: 14px;
    border-bottom: 1px solid #ececec;
    vertical-align: top;
  }
  tbody td.right { text-align: right; }
  .item-title {
    font-family: 'Georgia', serif;
    font-size: 13px;
    font-weight: 700;
    color: #1a1a1a;
  }
  .item-sub {
    font-size: 9px;
    color: #888;
    margin-top: 4px;
  }
  .item-amount {
    font-family: 'Georgia', serif;
    font-size: 14px;
    font-weight: 700;
  }

  /* totals */
  .totals-wrap {
    padding: 18px 50px 0;
    display: flex;
    justify-content: flex-end;
  }
  .totals {
    width: 280px;
  }
  .totals .row {
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    padding: 6px 0;
    color: #444;
  }
  .totals .row.paid { color: #1f7a3a; font-weight: 700; }
  .totals .divider {
    height: 1px;
    background: #ececec;
    margin: 6px 0;
  }
  .totals .row.due {
    font-family: 'Georgia', serif;
    font-size: 16px;
    font-weight: 700;
    color: ${accentColor};
    padding-top: 8px;
    align-items: baseline;
  }
  .totals .row.due .lbl {
    letter-spacing: 1.5px;
    font-size: 11px;
    text-transform: uppercase;
  }

  /* status pill */
  .pill-wrap {
    text-align: center;
    margin: 30px 0 0;
  }
  .pill {
    display: inline-block;
    padding: 10px 28px;
    border: 1.5px solid ${accentColor};
    border-radius: 999px;
    background: ${accentSoftBg};
    color: ${accentColor};
    font-weight: 700;
    font-size: 11px;
    letter-spacing: 2.5px;
  }

  /* footer */
  .foot {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 20px 50px 28px;
    border-top: 1px solid #ececec;
    text-align: center;
  }
  .foot .line1 {
    font-family: 'Georgia', serif;
    font-style: italic;
    color: #1a1a1a;
    font-size: 11px;
  }
  .foot .line2 {
    font-size: 7.5px;
    color: #888;
    margin-top: 8px;
  }
  .foot .line3 {
    font-size: 7.5px;
    color: #c47a2c;
    font-weight: 700;
    letter-spacing: 2px;
    margin-top: 6px;
  }
</style>
</head>
<body>
  <div class="wm">${watermarkText}</div>

  <div class="content">
    <div class="accent"></div>
    <div class="head">
      <div class="brand">
        ${LOGO_DATA_URI
        ? `<img class="logo" src="${LOGO_DATA_URI}" alt="logo" />`
        : `<div class="mono-fallback">MS</div>`}
        <div>
          <div class="name">Memory and Story</div>
          <div class="tag">PHOTOGRAPHY &nbsp;·&nbsp; CINEMATOGRAPHY</div>
          <div class="contact">Bashabo, Dhaka, Bangladesh</div>
        </div>
      </div>
      <div class="invoice-meta">
        <div class="label">INVOICE</div>
        <div class="num">No. ${esc(inv.invoiceNo)}</div>
        <div class="num">Issued ${fmtDate(inv.createdAt)}</div>
      </div>
    </div>

    <div class="meta-row">
      <div class="meta-block">
        <div class="lbl">BILLED TO</div>
        <div class="val">${esc(((_j = inv.user) === null || _j === void 0 ? void 0 : _j.name) || '—')}</div>
        ${((_k = inv.user) === null || _k === void 0 ? void 0 : _k.email) ? `<div class="sub">${esc(inv.user.email)}</div>` : ''}
      </div>
      <div class="meta-block right">
        <div class="lbl">SESSION</div>
        <div class="val">${esc(sessionDate)}</div>
      </div>
    </div>

    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>DESCRIPTION</th>
            <th class="right">AMOUNT</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <div class="item-title">${serviceTitle}</div>
              <div class="item-sub">Pre-shoot consultation · full coverage · pro retouching · private gallery</div>
            </td>
            <td class="right">
              <div class="item-amount">${fmtBdt(inv.totalAmount)}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="totals-wrap">
      <div class="totals">
        <div class="row">
          <span>Subtotal</span>
          <span>${fmtBdt(subtotal)}</span>
        </div>
        ${discountAmount > 0 ? `
        <div class="row">
          <span>Discount</span>
          <span>− ${fmtBdt(discountAmount)}</span>
        </div>
        ` : ''}
        <div class="row paid">
          <span>Paid this invoice</span>
          <span>${fmtBdt(inv.amountPaid)}</span>
        </div>
        <div class="divider"></div>
        <div class="row due">
          <span class="lbl">${fullyPaid ? 'Total Paid' : 'Amount Due'}</span>
          <span>${fmtBdt(fullyPaid ? inv.amountPaid : inv.amountDue)}</span>
        </div>
      </div>
    </div>

    <div class="pill-wrap">
      <div class="pill">${statusLabel}</div>
    </div>
  </div>

  <div class="foot">
    <div class="line1">Thank you — your story matters to us.</div>
    <div class="line2">This is a computer-generated invoice. No signature required.</div>
    <div class="line3">#${esc(inv.invoiceNo)}</div>
  </div>
</body>
</html>`;
};
// Singleton browser — cold start ~1s, reuse for subsequent requests.
let browserPromise = null;
const getBrowser = () => {
    if (!browserPromise) {
        browserPromise = puppeteer_1.default.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });
    }
    return browserPromise;
};
const renderPdfBuffer = (html) => __awaiter(void 0, void 0, void 0, function* () {
    const browser = yield getBrowser();
    const page = yield browser.newPage();
    try {
        yield page.setContent(html, { waitUntil: 'load' });
        const pdf = yield page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '0', right: '0', bottom: '0', left: '0' },
        });
        return Buffer.from(pdf);
    }
    finally {
        yield page.close();
    }
});
const streamPdf = (id, userId, isAdmin, out) => __awaiter(void 0, void 0, void 0, function* () {
    const inv = yield getOne(id, userId, isAdmin);
    const html = buildHtml(inv);
    const buf = yield renderPdfBuffer(html);
    out.end(buf);
});
exports.PaymentInvoiceService = { listMine, listAll, getOne, streamPdf };
