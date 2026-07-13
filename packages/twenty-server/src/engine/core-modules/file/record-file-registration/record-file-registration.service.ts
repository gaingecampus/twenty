import { Injectable, Logger } from '@nestjs/common';

import { isNonEmptyString } from '@sniptt/guards';
import { PermissionFlagType } from 'twenty-shared/constants';
import { STANDARD_OBJECTS } from 'twenty-shared/metadata';
import {
  FieldActorSource,
  FileFolder,
  type ActorMetadata,
} from 'twenty-shared/types';
import { capitalize, isDefined } from 'twenty-shared/utils';
import { IsNull, Not } from 'typeorm';

import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { FileEntity } from 'src/engine/core-modules/file/entities/file.entity';
import { FilesFieldService } from 'src/engine/core-modules/file/files-field/services/files-field.service';
import { type RegisterFileOnRecordInput } from 'src/engine/core-modules/file/record-file-registration/types/register-file-on-record.input';
import { FileService } from 'src/engine/core-modules/file/services/file.service';
import { CreateRecordService } from 'src/engine/core-modules/record-crud/services/create-record.service';
import { FindRecordsService } from 'src/engine/core-modules/record-crud/services/find-records.service';
import { type ToolOutput } from 'src/engine/core-modules/tool/types/tool-output.type';
import { type ToolProviderContext } from 'src/engine/core-modules/tool-provider/interfaces/tool-provider-context.type';
import { AgentMessagePartEntity } from 'src/engine/metadata-modules/ai/ai-agent-execution/entities/agent-message-part.entity';
import { WorkspaceManyOrAllFlatEntityMapsCacheService } from 'src/engine/metadata-modules/flat-entity/services/workspace-many-or-all-flat-entity-maps-cache.service';
import { type FlatObjectMetadata } from 'src/engine/metadata-modules/flat-object-metadata/types/flat-object-metadata.type';
import { PermissionsService } from 'src/engine/metadata-modules/permissions/permissions.service';
import { InjectWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/inject-workspace-scoped-repository.decorator';
import { WorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';
import { ATTACHMENT_KIND } from 'src/modules/messaging/email-attachment/constants/attachment-kind.constant';

const MAX_REGISTER_FILE_BASE64_BYTES = 10 * 1024 * 1024;

export type RegisterFileOnRecordResult = {
  attachmentId: string;
  fileId: string;
  filename: string;
  objectNameSingular: string;
  recordId: string;
};

@Injectable()
export class RecordFileRegistrationService {
  private readonly logger = new Logger(RecordFileRegistrationService.name);

  constructor(
    private readonly fileService: FileService,
    private readonly filesFieldService: FilesFieldService,
    private readonly createRecordService: CreateRecordService,
    private readonly findRecordsService: FindRecordsService,
    private readonly permissionsService: PermissionsService,
    private readonly workspaceManyOrAllFlatEntityMapsCacheService: WorkspaceManyOrAllFlatEntityMapsCacheService,
    @InjectWorkspaceScopedRepository(FileEntity)
    private readonly fileRepository: WorkspaceScopedRepository<FileEntity>,
    @InjectWorkspaceScopedRepository(AgentMessagePartEntity)
    private readonly agentMessagePartRepository: WorkspaceScopedRepository<AgentMessagePartEntity>,
  ) {}

  async registerFileOnRecord({
    input,
    authContext,
    rolePermissionConfig,
    actorContext,
  }: {
    input: RegisterFileOnRecordInput;
    authContext: WorkspaceAuthContext;
    rolePermissionConfig: ToolProviderContext['rolePermissionConfig'];
    actorContext?: ActorMetadata;
  }): Promise<ToolOutput<RegisterFileOnRecordResult>> {
    const workspaceId = authContext.workspace.id;

    const hasUploadPermission = await this.permissionsService.hasToolPermission(
      rolePermissionConfig,
      workspaceId,
      PermissionFlagType.UPLOAD_FILE,
    );

    if (!hasUploadPermission) {
      return {
        success: false,
        message: 'Missing UPLOAD_FILE permission',
        error:
          'Your role does not have UPLOAD_FILE permission required to register files on records.',
      };
    }

    const { flatObjectMetadataMaps, flatFieldMetadataMaps } =
      await this.workspaceManyOrAllFlatEntityMapsCacheService.getOrRecomputeManyOrAllFlatEntityMaps(
        {
          workspaceId,
          flatMapsKeys: ['flatObjectMetadataMaps', 'flatFieldMetadataMaps'],
        },
      );

    const targetObject = Object.values(
      flatObjectMetadataMaps.byUniversalIdentifier,
    ).find(
      (objectMetadata): objectMetadata is FlatObjectMetadata =>
        isDefined(objectMetadata) &&
        objectMetadata.nameSingular === input.objectNameSingular &&
        objectMetadata.isActive === true,
    );

    if (!isDefined(targetObject)) {
      return {
        success: false,
        message: `Object "${input.objectNameSingular}" not found`,
        error: `No active object metadata found for "${input.objectNameSingular}"`,
      };
    }

    const targetJoinColumn = this.resolveTargetJoinColumn({
      objectNameSingular: input.objectNameSingular,
      flatObjectMetadataMaps,
      flatFieldMetadataMaps,
    });

    if (!targetJoinColumn.success) {
      return targetJoinColumn;
    }

    const targetRecordResult = await this.findRecordsService.execute({
      objectName: input.objectNameSingular,
      filter: { id: { eq: input.recordId } },
      limit: 1,
      authContext,
      rolePermissionConfig,
    });

    if (
      !targetRecordResult.success ||
      !isDefined(targetRecordResult.result) ||
      (targetRecordResult.result.records?.length ?? 0) === 0
    ) {
      return {
        success: false,
        message: `Target ${input.objectNameSingular} not found or not accessible`,
        error: `Record ${input.recordId} was not found for object "${input.objectNameSingular}" with current permissions.`,
      };
    }

    const sourceFile = await this.resolveSourceFileBuffer({
      input,
      workspaceId,
    });

    if (!sourceFile.success) {
      return sourceFile;
    }

    try {
      const savedFile = await this.filesFieldService.uploadFile({
        file: sourceFile.buffer,
        filename: sourceFile.filename,
        workspaceId,
        fieldMetadataUniversalIdentifier:
          STANDARD_OBJECTS.attachment.fields.file.universalIdentifier,
      });

      const createdBy: ActorMetadata = actorContext ?? {
        source: FieldActorSource.AGENT,
        name: 'Agent',
      };

      // FILES create input is FileInput (fileId + label only). Extension is
      // derived server-side on read (FileOutput) — do not pass it here.
      const createResult = await this.createRecordService.execute({
        objectName: 'attachment',
        objectRecord: {
          name: sourceFile.filename,
          attachmentKind: ATTACHMENT_KIND.FILE,
          [targetJoinColumn.joinColumnName]: input.recordId,
          file: [
            {
              fileId: savedFile.id,
              label: sourceFile.filename,
            },
          ],
        },
        authContext,
        rolePermissionConfig,
        createdBy,
        slimResponse: true,
      });

      if (!createResult.success || !isDefined(createResult.result?.id)) {
        return {
          success: false,
          message: 'Failed to create attachment record',
          error: createResult.error ?? createResult.message,
        };
      }

      return {
        success: true,
        message: `Registered ${sourceFile.filename} on ${input.objectNameSingular}`,
        result: {
          attachmentId: createResult.result.id,
          fileId: savedFile.id,
          filename: sourceFile.filename,
          objectNameSingular: input.objectNameSingular,
          recordId: input.recordId,
        },
        recordReferences: createResult.recordReferences,
      };
    } catch (error) {
      this.logger.error(
        `registerFileOnRecord failed: ${error instanceof Error ? error.message : error}`,
      );

      return {
        success: false,
        message: 'Failed to register file on record',
        error:
          error instanceof Error
            ? error.message
            : 'Unexpected error while registering file',
      };
    }
  }

  private resolveTargetJoinColumn({
    objectNameSingular,
    flatObjectMetadataMaps,
    flatFieldMetadataMaps,
  }: {
    objectNameSingular: string;
    flatObjectMetadataMaps: {
      byUniversalIdentifier: Record<string, FlatObjectMetadata | undefined>;
    };
    flatFieldMetadataMaps: {
      byUniversalIdentifier: Record<
        string,
        { objectMetadataId: string; name: string } | undefined
      >;
    };
  }): { success: true; joinColumnName: string } | ToolOutput {
    // Morph relation field is "targetCompany"; join column for create is "targetCompanyId"
    const morphFieldName = `target${capitalize(objectNameSingular)}`;
    const joinColumnName = `${morphFieldName}Id`;

    const attachmentObject = Object.values(
      flatObjectMetadataMaps.byUniversalIdentifier,
    ).find(
      (objectMetadata): objectMetadata is FlatObjectMetadata =>
        isDefined(objectMetadata) &&
        objectMetadata.nameSingular === 'attachment',
    );

    if (!isDefined(attachmentObject)) {
      return {
        success: false,
        message: 'Attachment object metadata missing',
        error:
          'Could not resolve attachment object metadata for this workspace',
      };
    }

    // Do not rely on attachmentObject.fieldIds — it can be missing on cached
    // flat maps. Match morph field by objectMetadataId + name instead.
    const hasMorphField = Object.values(
      flatFieldMetadataMaps.byUniversalIdentifier,
    ).some(
      (field) =>
        isDefined(field) &&
        field.objectMetadataId === attachmentObject.id &&
        field.name === morphFieldName,
    );

    if (!hasMorphField) {
      return {
        success: false,
        message: `Object "${objectNameSingular}" does not support attachments`,
        error: `Attachment has no morph field "${morphFieldName}". Custom objects get this relation when created; ensure the object exists and has attachments enabled.`,
      };
    }

    return { success: true, joinColumnName };
  }

  private async resolveSourceFileBuffer({
    input,
    workspaceId,
  }: {
    input: RegisterFileOnRecordInput;
    workspaceId: string;
  }): Promise<
    { success: true; buffer: Buffer; filename: string } | ToolOutput
  > {
    // Prefer sourceFileId over contentBase64 when both are present so AI
    // cannot rename an existing chat upload by also passing filename.
    if (isNonEmptyString(input.sourceFileId)) {
      return this.resolveAgentChatSourceFile({
        fileId: input.sourceFileId,
        workspaceId,
      });
    }

    if (isNonEmptyString(input.contentBase64)) {
      return this.decodeBase64Content({
        contentBase64: input.contentBase64,
        filename: input.filename ?? 'upload.bin',
      });
    }

    return {
      success: false,
      message: 'Missing file source',
      error: 'Provide either sourceFileId or contentBase64',
    };
  }

  private async resolveAgentChatSourceFile({
    fileId,
    workspaceId,
  }: {
    fileId: string;
    workspaceId: string;
  }): Promise<
    { success: true; buffer: Buffer; filename: string } | ToolOutput
  > {
    const fileContent = await this.fileService.getFileContentById({
      fileId,
      workspaceId,
      fileFolder: FileFolder.AgentChat,
    });

    if (!isDefined(fileContent)) {
      return {
        success: false,
        message: 'AgentChat file not found',
        error: `File ${fileId} was not found in the agent-chat folder for this workspace. Upload via AI Chat or pass contentBase64.`,
      };
    }

    const filename = await this.resolveOriginalAgentChatFilename({
      fileId,
      workspaceId,
      mimeType: fileContent.mimeType,
    });

    return {
      success: true,
      buffer: fileContent.buffer,
      filename,
    };
  }

  // Original user-facing name lives on the chat message part, not FileEntity.path
  // (storage path is usually `{uuid}.{ext}`). Never trust tool input.filename here.
  private async resolveOriginalAgentChatFilename({
    fileId,
    workspaceId,
    mimeType,
  }: {
    fileId: string;
    workspaceId: string;
    mimeType: string;
  }): Promise<string> {
    const messagePart = await this.agentMessagePartRepository.findOne(
      workspaceId,
      {
        where: {
          fileId,
          fileFilename: Not(IsNull()),
        },
        order: {
          createdAt: 'DESC',
        },
      },
    );

    if (isDefined(messagePart) && isNonEmptyString(messagePart.fileFilename)) {
      return messagePart.fileFilename;
    }

    const fileEntity = await this.fileRepository.findOne(workspaceId, {
      where: { id: fileId },
    });

    if (isDefined(fileEntity)) {
      const pathBasename = fileEntity.path.split('/').pop();

      if (isNonEmptyString(pathBasename) && !pathBasename.startsWith(fileId)) {
        return pathBasename;
      }
    }

    const extensionFromMime = mimeType.split('/')[1]?.split('+')[0];
    const safeExtension =
      isNonEmptyString(extensionFromMime) &&
      extensionFromMime !== 'octet-stream'
        ? extensionFromMime
        : 'bin';

    return `file-${fileId}.${safeExtension}`;
  }

  private decodeBase64Content({
    contentBase64,
    filename,
  }: {
    contentBase64: string;
    filename: string;
  }): { success: true; buffer: Buffer; filename: string } | ToolOutput {
    const normalizedBase64 = contentBase64.replace(/^data:[^;]+;base64,/, '');

    let buffer: Buffer;

    try {
      buffer = Buffer.from(normalizedBase64, 'base64');
    } catch {
      return {
        success: false,
        message: 'Invalid base64 content',
        error: 'contentBase64 could not be decoded',
      };
    }

    if (buffer.length === 0) {
      return {
        success: false,
        message: 'Empty file content',
        error: 'Decoded contentBase64 is empty',
      };
    }

    if (buffer.length > MAX_REGISTER_FILE_BASE64_BYTES) {
      return {
        success: false,
        message: 'File too large',
        error: `File exceeds the ${MAX_REGISTER_FILE_BASE64_BYTES} byte limit`,
      };
    }

    return {
      success: true,
      buffer,
      filename,
    };
  }
}
