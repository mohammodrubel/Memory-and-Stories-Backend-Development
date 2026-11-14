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
exports.ContractService = void 0;
const prisma_1 = __importDefault(require("../../utils/prisma"));
const getTemplate = () => __awaiter(void 0, void 0, void 0, function* () {
    const row = yield prisma_1.default.contractTemplate.findFirst({
        orderBy: { updatedAt: 'desc' },
    });
    if (row)
        return row;
    // Auto-create empty template on first read
    return prisma_1.default.contractTemplate.create({
        data: {
            title: 'Service Agreement',
            intro: 'This Service Agreement is made between the Studio and the Customer named in the booking.',
            clauses: [
                {
                    title: 'Scope of work',
                    body: 'The Studio shall provide photography and/or videography services as described in the selected package.',
                },
                {
                    title: 'Payment',
                    body: 'Customer agrees to pay the total amount through the payment methods provided. Partial payments are accepted at the discretion of the Studio.',
                },
                {
                    title: 'Cancellation',
                    body: 'Cancellation must be requested at least 7 days prior to the event date. Payments made are non-refundable after the event date is confirmed.',
                },
            ],
        },
    });
});
const updateTemplate = (input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const existing = yield prisma_1.default.contractTemplate.findFirst({
        orderBy: { updatedAt: 'desc' },
    });
    if (existing) {
        return prisma_1.default.contractTemplate.update({
            where: { id: existing.id },
            data: {
                title: (_a = input.title) !== null && _a !== void 0 ? _a : existing.title,
                intro: (_b = input.intro) !== null && _b !== void 0 ? _b : existing.intro,
                clauses: input.clauses,
            },
        });
    }
    return prisma_1.default.contractTemplate.create({
        data: {
            title: input.title || 'Service Agreement',
            intro: input.intro || null,
            clauses: input.clauses,
        },
    });
});
const getBookingContract = (bookingId) => __awaiter(void 0, void 0, void 0, function* () { return prisma_1.default.bookingContract.findUnique({ where: { bookingId } }); });
const signBookingContract = (input) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    if (!((_a = input.signatoryName) === null || _a === void 0 ? void 0 : _a.trim()))
        throw new Error('Signatory name required');
    if (!((_b = input.signatureDataUrl) === null || _b === void 0 ? void 0 : _b.startsWith('data:image/')))
        throw new Error('Invalid signature');
    const template = yield getTemplate();
    return prisma_1.default.bookingContract.upsert({
        where: { bookingId: input.bookingId },
        create: {
            bookingId: input.bookingId,
            signatoryName: input.signatoryName.trim(),
            signatureDataUrl: input.signatureDataUrl,
            snapshotTitle: template.title,
            snapshotIntro: template.intro,
            snapshotClauses: template.clauses,
            signedIp: input.signedIp || null,
        },
        update: {
            signatoryName: input.signatoryName.trim(),
            signatureDataUrl: input.signatureDataUrl,
            snapshotTitle: template.title,
            snapshotIntro: template.intro,
            snapshotClauses: template.clauses,
            signedAt: new Date(),
            signedIp: input.signedIp || null,
        },
    });
});
exports.ContractService = {
    getTemplate,
    updateTemplate,
    getBookingContract,
    signBookingContract,
};
