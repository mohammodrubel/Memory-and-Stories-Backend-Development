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
exports.SiteSettingsService = void 0;
const prisma_1 = __importDefault(require("../../utils/prisma"));
const SINGLETON_ID = 'singleton';
const get = () => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield prisma_1.default.siteSettings.findUnique({
        where: { id: SINGLETON_ID },
    });
    if (existing)
        return existing;
    // Auto-create empty singleton on first read so admin UI has a row to edit.
    return prisma_1.default.siteSettings.create({ data: { id: SINGLETON_ID } });
});
const update = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    return prisma_1.default.siteSettings.upsert({
        where: { id: SINGLETON_ID },
        update: payload,
        create: Object.assign({ id: SINGLETON_ID }, payload),
    });
});
exports.SiteSettingsService = { get, update };
