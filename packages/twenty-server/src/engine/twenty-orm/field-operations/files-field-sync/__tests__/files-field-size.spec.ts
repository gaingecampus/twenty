import { FilesFieldSync } from 'src/engine/twenty-orm/field-operations/files-field-sync/files-field-sync';
import { type WorkspaceInternalContext } from 'src/engine/twenty-orm/interfaces/workspace-internal-context.interface';

jest.mock(
  'src/engine/twenty-orm/utils/get-object-metadata-from-entity-target.util',
  () => ({
    getObjectMetadataFromEntityTarget: () => ({ id: 'attachment' }),
  }),
);

describe('FilesFieldSync size enrichment', () => {
  it('uses the workspace-scoped stored file size instead of client-supplied size', async () => {
    const find = jest.fn().mockResolvedValue([
      {
        id: 'file',
        path: 'field/report.pdf',
        size: 2048,
        settings: { isTemporaryFile: true },
      },
    ]);
    const context = {
      coreDataSource: { getRepository: () => ({ find }) },
    } as unknown as WorkspaceInternalContext;
    const sync = new FilesFieldSync(context);
    jest
      .spyOn(
        sync as unknown as { getFilesFields: () => unknown[] },
        'getFilesFields',
      )
      .mockReturnValue([{ name: 'file', universalIdentifier: 'field' }]);
    const file = { fileId: 'file', label: 'report.pdf', size: 1 };
    const result = await sync.enrichFilesFields<{
      file: {
        fileId: string;
        label: string;
        size?: number;
        extension?: string;
      }[];
    }>({
      entities: [{ file: [file] }],
      filesFieldDiffByEntityIndex: {
        0: { file: { toAdd: [file], toUpdate: [], toRemove: [] } },
      },
      workspaceId: 'workspace',
      target: 'attachment',
    });
    expect(result.entities[0].file).toEqual([
      { fileId: 'file', label: 'report.pdf', extension: '.pdf', size: 2048 },
    ]);
    expect(find).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ workspaceId: 'workspace' }),
        select: expect.arrayContaining(['size']),
      }),
    );
  });
});
