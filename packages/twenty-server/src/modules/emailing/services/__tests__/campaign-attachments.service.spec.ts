import { Readable } from 'stream';
import { CampaignAttachmentsService } from 'src/modules/emailing/services/campaign-attachments.service';

describe('CampaignAttachmentsService', () => {
  const files = { find: jest.fn(), update: jest.fn() };
  const storage = { getFileStreamById: jest.fn() };
  const service = new CampaignAttachmentsService(
    files as unknown as ConstructorParameters<
      typeof CampaignAttachmentsService
    >[0],
    storage as unknown as ConstructorParameters<
      typeof CampaignAttachmentsService
    >[1],
  );
  const attachment = { id: 'file', name: 'guide.txt' };

  beforeEach(() => {
    jest.clearAllMocks();
    files.find.mockResolvedValue([
      { id: 'file', size: 5, mimeType: 'text/plain' },
    ]);
    storage.getFileStreamById.mockImplementation(async () => ({
      stream: Readable.from(Buffer.from('guide')),
    }));
  });

  it('loads file bytes within the workspace and retains scheduled uploads', async () => {
    expect(await service.load('workspace', [attachment])).toEqual([
      {
        filename: 'guide.txt',
        content: Buffer.from('guide'),
        contentType: 'text/plain',
      },
    ]);
    await service.retain('workspace', [attachment]);
    expect(files.update).toHaveBeenCalledWith('workspace', expect.anything(), {
      settings: { isTemporaryFile: false, toDelete: false },
    });
    expect(storage.getFileStreamById).toHaveBeenCalledWith(
      expect.objectContaining({ workspaceId: 'workspace', fileId: 'file' }),
    );
  });

  it('rejects missing or other-workspace files before reading storage', async () => {
    files.find.mockResolvedValue([]);
    await expect(service.load('workspace', [attachment])).rejects.toThrow();
    expect(storage.getFileStreamById).not.toHaveBeenCalled();
  });

  it('rejects oversized attachments before reading storage', async () => {
    files.find.mockResolvedValue([{ id: 'file', size: 26 * 1024 * 1024 }]);
    await expect(service.load('workspace', [attachment])).rejects.toThrow(
      '25MB',
    );
    expect(storage.getFileStreamById).not.toHaveBeenCalled();
  });
});
