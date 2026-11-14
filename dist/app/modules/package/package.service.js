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
exports.PackageService = exports.getSingleServiceService = void 0;
const http_status_1 = __importDefault(require("http-status"));
const prisma_1 = __importDefault(require("../../utils/prisma"));
const AppError_1 = __importDefault(require("../../errors/AppError"));
const discount_service_1 = require("../discount/discount.service");
const createServiceService = (payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, description, amount, days } = payload;
    return yield prisma_1.default.service.create({
        data: {
            title,
            description,
            amount: Number(amount),
            days: {
                create: days === null || days === void 0 ? void 0 : days.map((day) => {
                    var _a;
                    return ({
                        dayName: day.dayName,
                        events: {
                            create: (_a = day.events) === null || _a === void 0 ? void 0 : _a.map((event) => {
                                var _a;
                                return ({
                                    eventName: event.eventName,
                                    photographers: Number(event.photographers),
                                    cinematographers: Number(event.cinematographers),
                                    features: {
                                        create: (_a = event.features) === null || _a === void 0 ? void 0 : _a.map((name) => ({
                                            name,
                                        })),
                                    },
                                });
                            }),
                        },
                    });
                }),
            },
        },
        include: {
            days: {
                include: {
                    events: {
                        include: {
                            features: true,
                        },
                    },
                },
            },
        },
    });
});
// GET ALL with search, filter, pagination
const getAllServicesService = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const { searchTerm, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', includeArchived = false } = options;
    const skip = (page - 1) * limit;
    const take = limit;
    const where = includeArchived ? {} : { archived: false };
    if (searchTerm) {
        where.OR = [
            { title: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
        ];
    }
    const [result, total] = yield Promise.all([
        prisma_1.default.service.findMany({
            where,
            skip,
            take,
            orderBy: { [sortBy]: sortOrder },
            include: {
                days: {
                    include: {
                        events: {
                            include: {
                                features: true,
                            },
                        },
                    },
                },
            },
        }),
        prisma_1.default.service.count({ where }),
    ]);
    // Attach auto-sale pricing to each service
    const dataWithSale = yield Promise.all(result.map((svc) => __awaiter(void 0, void 0, void 0, function* () {
        const sale = yield (0, discount_service_1.resolveAutoSaleForService)(svc.id, svc.amount);
        return Object.assign(Object.assign({}, svc), { onSale: sale !== null, effectivePrice: sale ? svc.amount - sale.amount : svc.amount, saleDiscount: sale !== null && sale !== void 0 ? sale : null });
    })));
    return {
        data: dataWithSale,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
});
const getSingleServiceService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    return yield prisma_1.default.service.findUnique({
        where: { id },
        include: {
            days: {
                include: {
                    events: {
                        include: {
                            features: true,
                        },
                    },
                },
            },
        },
    });
});
exports.getSingleServiceService = getSingleServiceService;
// Packages referenced by existing bookings can't be hard-deleted without
// breaking those records (Booking.serviceId is a required FK) — archive
// instead so it disappears from the storefront but booking history stays intact.
const deleteServiceService = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const existing = yield prisma_1.default.service.findUnique({ where: { id } });
    if (!existing) {
        throw new AppError_1.default(http_status_1.default.NOT_FOUND, 'Package not found');
    }
    const bookingCount = yield prisma_1.default.booking.count({ where: { serviceId: id } });
    if (bookingCount > 0) {
        const archived = yield prisma_1.default.service.update({
            where: { id },
            data: { archived: true },
        });
        return { archived: true, deleted: false, data: archived };
    }
    const deleted = yield prisma_1.default.service.delete({ where: { id } });
    return { archived: false, deleted: true, data: deleted };
});
const updateService = (id, payload) => __awaiter(void 0, void 0, void 0, function* () {
    const { title, description, amount, days } = payload;
    // Step 1: delete old nested data (safe reset)
    yield prisma_1.default.feature.deleteMany({
        where: {
            event: {
                day: {
                    serviceId: id,
                },
            },
        },
    });
    yield prisma_1.default.event.deleteMany({
        where: {
            day: {
                serviceId: id,
            },
        },
    });
    yield prisma_1.default.day.deleteMany({
        where: {
            serviceId: id,
        },
    });
    // Step 2: update main service + recreate structure
    return yield prisma_1.default.service.update({
        where: { id },
        data: {
            title,
            description,
            amount: Number(amount),
            days: {
                create: days === null || days === void 0 ? void 0 : days.map((day) => {
                    var _a;
                    return ({
                        dayName: day.dayName,
                        events: {
                            create: (_a = day.events) === null || _a === void 0 ? void 0 : _a.map((event) => {
                                var _a;
                                return ({
                                    eventName: event.eventName,
                                    photographers: Number(event.photographers),
                                    cinematographers: Number(event.cinematographers),
                                    features: {
                                        create: (_a = event.features) === null || _a === void 0 ? void 0 : _a.map((name) => ({
                                            name,
                                        })),
                                    },
                                });
                            }),
                        },
                    });
                }),
            },
        },
        include: {
            days: {
                include: {
                    events: {
                        include: {
                            features: true,
                        },
                    },
                },
            },
        },
    });
});
exports.PackageService = {
    createServiceService,
    getAllServicesService,
    getSingleServiceService: exports.getSingleServiceService,
    updateService,
    deleteServiceService
};
