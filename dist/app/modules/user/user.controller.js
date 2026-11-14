"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.UserController = void 0;
const catchAsync_1 = __importDefault(require("../../utils/catchAsync"));
const user_service_1 = require("./user.service");
const sendResponse_1 = __importDefault(require("../../utils/sendResponse"));
const http_status_1 = __importDefault(require("http-status"));
// GET ALL with search, filter, pagination
const GetAllUsers = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { search, page, limit, sortBy, sortOrder, role } = req.query;
    const options = {
        searchTerm: search,
        page: Number(page) || 1,
        limit: Number(limit) || 10,
        sortBy: sortBy,
        sortOrder: sortOrder,
        role: role,
    };
    const result = yield user_service_1.UserService.GetAllUsers(options);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Users retrieve successful',
        data: result.data,
        meta: result.meta,
    });
}));
const GetSingleUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const id = typeof ((_a = req.params) === null || _a === void 0 ? void 0 : _a.id) === 'string' ? req.params.id : '';
    const result = yield user_service_1.UserService.GetSingleUser(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'User retrieve successful',
        data: result,
    });
}));
const GetProfile = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const result = yield user_service_1.UserService.GetProfile(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Profile retrieved successful',
        data: result,
    });
}));
const UpdateProfile = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const id = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
    const result = yield user_service_1.UserService.UpdateProfile(id, req.body);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: 'Profile updated successful',
        data: result,
    });
}));
const ExportUsers = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const role = req.query.role;
    const users = yield user_service_1.UserService.ExportUsers(role);
    const headers = ['Name', 'Email', 'Phone', 'WhatsApp', 'Role', 'Signed Up'];
    const escape = (v) => {
        const s = v == null ? '' : String(v);
        if (/[",\n\r]/.test(s))
            return `"${s.replace(/"/g, '""')}"`;
        return s;
    };
    const rows = users.map((u) => [
        u.name,
        u.email,
        u.phone || '',
        u.whatsapp ? 'Yes' : 'No',
        u.role,
        u.createdAt.toISOString(),
    ]
        .map(escape)
        .join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="users-${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send('﻿' + csv); // BOM for Excel
}));
const SetUserRole = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.params.id;
    const { role, password } = req.body || {};
    const allowed = ['ADMIN', 'MANAGER', 'USER'];
    if (!allowed.includes(role)) {
        return res
            .status(400)
            .json({ success: false, message: 'role must be ADMIN | MANAGER | USER' });
    }
    if (!password || typeof password !== 'string') {
        return res
            .status(400)
            .json({ success: false, message: 'password required to change role' });
    }
    // Prevent self-demotion (lock yourself out)
    if (req.user.id === id && role !== 'ADMIN') {
        return res
            .status(400)
            .json({ success: false, message: 'Cannot change your own role' });
    }
    const bcrypt = yield Promise.resolve().then(() => __importStar(require('bcrypt')));
    const ok = yield bcrypt.compare(password, req.user.password);
    if (!ok) {
        return res
            .status(401)
            .json({ success: false, message: 'Wrong password' });
    }
    const result = yield user_service_1.UserService.SetUserRole(id, role);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.OK,
        message: `Role set to ${role}`,
        data: result,
    });
}));
const DeleteUser = (0, catchAsync_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const id = typeof ((_a = req.params) === null || _a === void 0 ? void 0 : _a.id) === 'string' ? req.params.id : '';
    yield user_service_1.UserService.DeleteUser(id);
    (0, sendResponse_1.default)(res, {
        success: true,
        statusCode: http_status_1.default.NO_CONTENT,
    });
}));
exports.UserController = {
    GetAllUsers,
    GetSingleUser,
    GetProfile,
    UpdateProfile,
    DeleteUser,
    ExportUsers,
    SetUserRole,
};
