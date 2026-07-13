import { Test, type TestingModule } from '@nestjs/testing';

import { PermissionFlagType } from 'twenty-shared/constants';
import { FieldActorSource, FileFolder } from 'twenty-shared/types';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { FileEntity } from 'src/engine/core-modules/file/entities/file.entity';
import { FilesFieldService } from 'src/engine/core-modules/file/files-field/services/files-field.service';
import { RecordFileRegistrationService } from 'src/engine/core-modules/file/record-file-registration/record-file-registration.service';
import { FileService } from 'src/engine/core-modules/file/services/file.service';
import { CreateRecordService } from 'src/engine/core-modules/record-crud/services/create-record.service';
import { FindRecordsService } from 'src/engine/core-modules/record-crud/services/find-records.service';
import { AgentMessagePartEntity } from 'src/engine/metadata-modules/ai/ai-agent-execution/entities/agent-message-part.entity';
import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { PermissionsService } from 'src/engine/metadata-modules/permissions/permissions.service';
import { getWorkspaceScopedRepositoryToken } from 'src/engine/twenty-orm/workspace-scoped-repository/get-workspace-scoped-repository-token.util';

const COMPANY_OBJECT_UNIVERSAL_ID = 'company-object-uid';
const ATTACHMENT_OBJECT_UNIVERSAL_ID = 'attachment-object-uid';
const TARGET_COMPANY_FIELD_UNIVERSAL_ID = 'target-company-field-uid';

const buildFlatMaps = ({
  includeTargetCompanyField = true,
  includeAttachmentFieldIds = true,
}: {
  includeTargetCompanyField?: boolean;
  includeAttachmentFieldIds?: boolean;
} = {}) => ({
  flatObjectMetadataMaps: {
    byUniversalIdentifier: {
      [COMPANY_OBJECT_UNIVERSAL_ID]: {
        id: 'company-id',
        nameSingular: 'company',
        isActive: true,
        fieldIds: [],
      },
      [ATTACHMENT_OBJECT_UNIVERSAL_ID]: {
        id: 'attachment-id',
        nameSingular: 'attachment',
        isActive: true,
        ...(includeAttachmentFieldIds
          ? {
              fieldIds: includeTargetCompanyField
                ? ['target-company-field-id']
                : [],
            }
          : {}),
      },
    },
    universalIdentifierById: {
      'company-id': COMPANY_OBJECT_UNIVERSAL_ID,
      'attachment-id': ATTACHMENT_OBJECT_UNIVERSAL_ID,
    },
  },
  flatFieldMetadataMaps: {
    byUniversalIdentifier: includeTargetCompanyField
      ? {
          [TARGET_COMPANY_FIELD_UNIVERSAL_ID]: {
            id: 'target-company-field-id',
            objectMetadataId: 'attachment-id',
            name: 'targetCompany',
          },
        }
      : {},
    universalIdentifierById: includeTargetCompanyField
      ? {
          'target-company-field-id': TARGET_COMPANY_FIELD_UNIVERSAL_ID,
        }
      : {},
  },
});

describe('RecordFileRegistrationService', () => {
  let service: RecordFileRegistrationService;
  let mockHasToolPermission: jest.Mock;
  let mockGetOrRecomputeFlatMaps: jest.Mock;
  let mockFindRecordsExecute: jest.Mock;
  let mockGetFileContentById: jest.Mock;
  let mockUploadFile: jest.Mock;
  let mockCreateRecordExecute: jest.Mock;
  let mockFileRepositoryFindOne: jest.Mock;
  let mockAgentMessagePartRepositoryFindOne: jest.Mock;

  const authContext = {
    type: 'apiKey',
    workspace: { id: 'workspace-1' },
    apiKey: { id: 'api-key-1' },
  } as WorkspaceAuthContext;

  const rolePermissionConfig = { unionOf: ['role-1'] };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockHasToolPermission = jest.fn().mockResolvedValue(true);
    mockGetOrRecomputeFlatMaps = jest.fn().mockResolvedValue(buildFlatMaps());
    mockFindRecordsExecute = jest.fn().mockResolvedValue({
      success: true,
      result: { records: [{ id: 'company-record-1' }], totalCount: 1 },
    });
    mockGetFileContentById = jest.fn().mockResolvedValue({
      buffer: Buffer.from('pdf-bytes'),
      mimeType: 'application/pdf',
    });
    mockUploadFile = jest.fn().mockResolvedValue({
      id: 'files-field-file-1',
      path: 'files-field/x/files-field-file-1.pdf',
    });
    mockCreateRecordExecute = jest.fn().mockResolvedValue({
      success: true,
      result: { id: 'attachment-1' },
      recordReferences: [
        {
          objectNameSingular: 'attachment',
          recordId: 'attachment-1',
          displayName: 'Gemini_Generated_Image_original.png',
        },
      ],
    });
    mockFileRepositoryFindOne = jest.fn().mockResolvedValue({
      id: '22222222-2222-4222-8222-222222222222',
      path: 'agent-chat/22222222-2222-4222-8222-222222222222.pdf',
    });
    mockAgentMessagePartRepositoryFindOne = jest.fn().mockResolvedValue({
      fileId: '22222222-2222-4222-8222-222222222222',
      fileFilename: 'Gemini_Generated_Image_original.png',
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecordFileRegistrationService,
        {
          provide: FileService,
          useValue: { getFileContentById: mockGetFileContentById },
        },
        {
          provide: FilesFieldService,
          useValue: { uploadFile: mockUploadFile },
        },
        {
          provide: CreateRecordService,
          useValue: { execute: mockCreateRecordExecute },
        },
        {
          provide: FindRecordsService,
          useValue: { execute: mockFindRecordsExecute },
        },
        {
          provide: PermissionsService,
          useValue: { hasToolPermission: mockHasToolPermission },
        },
        {
          provide: WorkspaceManyOrAllFlatEntityMapsCacheService,
          useValue: {
            getOrRecomputeManyOrAllFlatEntityMaps: mockGetOrRecomputeFlatMaps,
          },
        },
        {
          provide: getWorkspaceScopedRepositoryToken(FileEntity),
          useValue: { findOne: mockFileRepositoryFindOne },
        },
        {
          provide: getWorkspaceScopedRepositoryToken(AgentMessagePartEntity),
          useValue: { findOne: mockAgentMessagePartRepositoryFindOne },
        },
      ],
    }).compile();

    service = module.get(RecordFileRegistrationService);
  });

  it('registers an AgentChat file using the original message-part filename', async () => {
    const result = await service.registerFileOnRecord({
      input: {
        objectNameSingular: 'company',
        recordId: '11111111-1111-4111-8111-111111111111',
        sourceFileId: '22222222-2222-4222-8222-222222222222',
        filename: '알밤.png',
      },
      authContext,
      rolePermissionConfig,
      actorContext: { source: FieldActorSource.AGENT, name: 'Agent' },
    });

    expect(result.success).toBe(true);
    expect(mockHasToolPermission).toHaveBeenCalledWith(
      rolePermissionConfig,
      'workspace-1',
      PermissionFlagType.UPLOAD_FILE,
    );
    expect(mockGetFileContentById).toHaveBeenCalledWith({
      fileId: '22222222-2222-4222-8222-222222222222',
      workspaceId: 'workspace-1',
      fileFolder: FileFolder.AgentChat,
    });
    expect(mockAgentMessagePartRepositoryFindOne).toHaveBeenCalled();
    expect(mockUploadFile).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: 'Gemini_Generated_Image_original.png',
      }),
    );
    expect(mockCreateRecordExecute).toHaveBeenCalledWith(
      expect.objectContaining({
        objectName: 'attachment',
        objectRecord: expect.objectContaining({
          name: 'Gemini_Generated_Image_original.png',
          attachmentKind: 'FILE',
          targetCompanyId: '11111111-1111-4111-8111-111111111111',
          file: [
            {
              fileId: 'files-field-file-1',
              label: 'Gemini_Generated_Image_original.png',
            },
          ],
        }),
      }),
    );
    expect(result.result).toEqual({
      attachmentId: 'attachment-1',
      fileId: 'files-field-file-1',
      filename: 'Gemini_Generated_Image_original.png',
      objectNameSingular: 'company',
      recordId: '11111111-1111-4111-8111-111111111111',
    });
  });

  it('prefers sourceFileId over contentBase64 when both are present', async () => {
    const result = await service.registerFileOnRecord({
      input: {
        objectNameSingular: 'company',
        recordId: '11111111-1111-4111-8111-111111111111',
        sourceFileId: '22222222-2222-4222-8222-222222222222',
        contentBase64: Buffer.from('wrong-bytes').toString('base64'),
        filename: 'wrong-name.png',
      },
      authContext,
      rolePermissionConfig,
    });

    expect(result.success).toBe(true);
    expect(mockGetFileContentById).toHaveBeenCalled();
    expect(mockUploadFile).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: 'Gemini_Generated_Image_original.png',
        file: Buffer.from('pdf-bytes'),
      }),
    );
  });

  it('registers from contentBase64 without reading AgentChat', async () => {
    const result = await service.registerFileOnRecord({
      input: {
        objectNameSingular: 'company',
        recordId: '11111111-1111-4111-8111-111111111111',
        contentBase64: Buffer.from('hello').toString('base64'),
        filename: 'note.txt',
      },
      authContext,
      rolePermissionConfig,
    });

    expect(result.success).toBe(true);
    expect(mockGetFileContentById).not.toHaveBeenCalled();
    expect(mockUploadFile).toHaveBeenCalledWith(
      expect.objectContaining({
        filename: 'note.txt',
        workspaceId: 'workspace-1',
      }),
    );
  });

  it('fails when UPLOAD_FILE permission is missing', async () => {
    mockHasToolPermission.mockResolvedValue(false);

    const result = await service.registerFileOnRecord({
      input: {
        objectNameSingular: 'company',
        recordId: '11111111-1111-4111-8111-111111111111',
        sourceFileId: '22222222-2222-4222-8222-222222222222',
      },
      authContext,
      rolePermissionConfig,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('UPLOAD_FILE');
    expect(mockCreateRecordExecute).not.toHaveBeenCalled();
  });

  it('fails when morph join column is missing', async () => {
    mockGetOrRecomputeFlatMaps.mockResolvedValue(
      buildFlatMaps({ includeTargetCompanyField: false }),
    );

    const result = await service.registerFileOnRecord({
      input: {
        objectNameSingular: 'company',
        recordId: '11111111-1111-4111-8111-111111111111',
        sourceFileId: '22222222-2222-4222-8222-222222222222',
      },
      authContext,
      rolePermissionConfig,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('targetCompany');
    expect(mockCreateRecordExecute).not.toHaveBeenCalled();
  });

  it('registers when attachment fieldIds is missing from flat maps', async () => {
    mockGetOrRecomputeFlatMaps.mockResolvedValue(
      buildFlatMaps({ includeAttachmentFieldIds: false }),
    );

    const result = await service.registerFileOnRecord({
      input: {
        objectNameSingular: 'company',
        recordId: '11111111-1111-4111-8111-111111111111',
        sourceFileId: '22222222-2222-4222-8222-222222222222',
      },
      authContext,
      rolePermissionConfig,
    });

    expect(result.success).toBe(true);
    expect(mockCreateRecordExecute).toHaveBeenCalled();
  });

  it('fails when target record is not accessible', async () => {
    mockFindRecordsExecute.mockResolvedValue({
      success: true,
      result: { records: [], totalCount: 0 },
    });

    const result = await service.registerFileOnRecord({
      input: {
        objectNameSingular: 'company',
        recordId: '11111111-1111-4111-8111-111111111111',
        sourceFileId: '22222222-2222-4222-8222-222222222222',
      },
      authContext,
      rolePermissionConfig,
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('not found or not accessible');
    expect(mockCreateRecordExecute).not.toHaveBeenCalled();
  });

  it('fails when AgentChat file is missing', async () => {
    mockGetFileContentById.mockResolvedValue(null);

    const result = await service.registerFileOnRecord({
      input: {
        objectNameSingular: 'company',
        recordId: '11111111-1111-4111-8111-111111111111',
        sourceFileId: '22222222-2222-4222-8222-222222222222',
      },
      authContext,
      rolePermissionConfig,
    });

    expect(result.success).toBe(false);
    expect(result.message).toContain('AgentChat file not found');
    expect(mockCreateRecordExecute).not.toHaveBeenCalled();
  });
});
