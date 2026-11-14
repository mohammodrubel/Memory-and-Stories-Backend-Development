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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PortfolioCategoryService = void 0;
const prisma_1 = __importDefault(require("../../utils/prisma"));
const list = () => __awaiter(void 0, void 0, void 0, function* () {
    const rows = yield prisma_1.default.portfolioCategory.findMany({
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        include: { _count: { select: { portfolios: true } } },
    });
    return rows.map((_a) => {
        var { _count } = _a, c = __rest(_a, ["_count"]);
        return (Object.assign(Object.assign({}, c), { count: _count.portfolios }));
    });
});
const create = (payload) => prisma_1.default.portfolioCategory.create({ data: { name: payload.name } });
const update = (id, payload) => prisma_1.default.portfolioCategory.update({ where: { id }, data: { name: payload.name } });
// Join rows cascade; portfolio images themselves are never deleted.
const remove = (id) => prisma_1.default.portfolioCategory.delete({ where: { id } });
exports.PortfolioCategoryService = { list, create, update, remove };
