import { describe, it, expect } from 'vitest';
import prisma from '../../src/app/utils/prisma';
import { PhotographerService } from '../../src/app/modules/photographer/photographer.service';

describe('PhotographerService', () => {
  it('list filters out archived by default', async () => {
    (prisma.photographer.findMany as any).mockResolvedValue([]);
    await PhotographerService.list(false);
    const where = (prisma.photographer.findMany as any).mock.calls[0][0].where;
    expect(where).toEqual({ archived: false });
  });

  it('list includes archived when flag set', async () => {
    (prisma.photographer.findMany as any).mockResolvedValue([]);
    await PhotographerService.list(true);
    const where = (prisma.photographer.findMany as any).mock.calls[0][0].where;
    expect(where).toEqual({});
  });

  it('create normalizes empty strings to null', async () => {
    (prisma.photographer.create as any).mockResolvedValue({ id: 'p1' });
    await PhotographerService.create({ name: 'Rahim', phone: '+880', email: '', notes: undefined });
    const data = (prisma.photographer.create as any).mock.calls[0][0].data;
    expect(data.email).toBeNull();
    expect(data.notes).toBeNull();
  });

  it('remove blocks when photographer has assignments', async () => {
    (prisma.photographer.findUnique as any).mockResolvedValue({ id: 'p1', name: 'Rahim' });
    (prisma.bookingAssignment.count as any).mockResolvedValue(2);
    await expect(PhotographerService.remove('p1')).rejects.toThrow(/assignments/);
    expect(prisma.photographer.delete).not.toHaveBeenCalled();
  });

  it('remove succeeds when zero assignments', async () => {
    (prisma.photographer.findUnique as any).mockResolvedValue({ id: 'p1', name: 'Rahim' });
    (prisma.bookingAssignment.count as any).mockResolvedValue(0);
    (prisma.photographer.delete as any).mockResolvedValue({ id: 'p1' });
    const result = await PhotographerService.remove('p1');
    expect(result).toEqual({ id: 'p1' });
  });
});
