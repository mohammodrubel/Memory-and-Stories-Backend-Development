import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import { UserService } from './user.service';
import sendResponse from '../../utils/sendResponse';
import httpStatus from 'http-status';

// GET ALL with search, filter, pagination
const GetAllUsers = catchAsync(async (req: Request, res: Response) => {
  const { search, page, limit, sortBy, sortOrder, role } = req.query;
  
  const options = {
    searchTerm: search as string,
    page: Number(page) || 1,
    limit: Number(limit) || 10,
    sortBy: sortBy as string,
    sortOrder: sortOrder as 'asc' | 'desc',
    role: role as string,
  };
  
  const result = await UserService.GetAllUsers(options);
  
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Users retrieve successful',
    data: result.data,
    meta: result.meta,
  });
});

const GetSingleUser = catchAsync(async (req: Request, res: Response) => {
  const id = typeof req.params?.id === 'string' ? req.params.id : '';
  const result = await UserService.GetSingleUser(id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'User retrieve successful',
    data: result,
  });
});

const GetProfile = catchAsync(async (req: Request, res: Response) => {
  const id = (req as any).user?.id;
  const result = await UserService.GetProfile(id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Profile retrieved successful',
    data: result,
  });
});

const UpdateProfile = catchAsync(async (req: Request, res: Response) => {
  const id = (req as any).user?.id;
  const result = await UserService.UpdateProfile(id, req.body);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: 'Profile updated successful',
    data: result,
  });
});

const ExportUsers = catchAsync(async (req: Request, res: Response) => {
  const role = req.query.role as string | undefined;
  const users = await UserService.ExportUsers(role);
  const headers = ['Name', 'Email', 'Phone', 'WhatsApp', 'Role', 'Signed Up'];
  const escape = (v: any) => {
    const s = v == null ? '' : String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const rows = users.map((u) =>
    [
      u.name,
      u.email,
      u.phone || '',
      u.whatsapp ? 'Yes' : 'No',
      u.role,
      u.createdAt.toISOString(),
    ]
      .map(escape)
      .join(','),
  );
  const csv = [headers.join(','), ...rows].join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="users-${new Date().toISOString().slice(0, 10)}.csv"`,
  );
  res.send('﻿' + csv); // BOM for Excel
});

const SetUserRole = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
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
  if ((req.user as any).id === id && role !== 'ADMIN') {
    return res
      .status(400)
      .json({ success: false, message: 'Cannot change your own role' });
  }
  const bcrypt = await import('bcrypt');
  const ok = await bcrypt.compare(password, (req.user as any).password);
  if (!ok) {
    return res
      .status(401)
      .json({ success: false, message: 'Wrong password' });
  }
  const result = await UserService.SetUserRole(id, role);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: `Role set to ${role}`,
    data: result,
  });
});

const DeleteUser = catchAsync(async (req: Request, res: Response) => {
  const id = typeof req.params?.id === 'string' ? req.params.id : '';
  await UserService.DeleteUser(id);
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.NO_CONTENT,
  });
});

export const UserController = {
  GetAllUsers,
  GetSingleUser,
  GetProfile,
  UpdateProfile,
  DeleteUser,
  ExportUsers,
  SetUserRole,
};
