import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { PermissionFlagType } from 'twenty-shared/constants';
import { FieldActorSource } from 'twenty-shared/types';
import { isDefined } from 'twenty-shared/utils';
import { type Repository } from 'typeorm';

import {
  AuthException,
  AuthExceptionCode,
} from 'src/engine/core-modules/auth/auth.exception';
import { type WorkspaceAuthContext } from 'src/engine/core-modules/auth/types/workspace-auth-context.type';
import { buildUserAuthContext } from 'src/engine/core-modules/auth/utils/build-user-auth-context.util';
import { RecordFileRegistrationService } from 'src/engine/core-modules/file/record-file-registration/record-file-registration.service';
import {
  RegisterFileOnRecordInputZodSchema,
  type RegisterFileOnRecordInput,
} from 'src/engine/core-modules/tool/tools/register-file-on-record-tool/register-file-on-record-tool.schema';
import { type ToolExecutionContext } from 'src/engine/core-modules/tool/types/tool-execution-context.type';
import { type ToolOutput } from 'src/engine/core-modules/tool/types/tool-output.type';
import { type Tool } from 'src/engine/core-modules/tool/types/tool.type';
import { UserEntity } from 'src/engine/core-modules/user/user.entity';
import { fromUserEntityToFlat } from 'src/engine/core-modules/user/utils/from-user-entity-to-flat.util';
import { type FlatWorkspace } from 'src/engine/core-modules/workspace/types/flat-workspace.type';
import { WorkspaceCacheService } from 'src/engine/workspace-cache/services/workspace-cache.service';

@Injectable()
export class RegisterFileOnRecordTool implements Tool {
  private readonly logger = new Logger(RegisterFileOnRecordTool.name);

  description =
    'Register an original file on a CRM record (same as the website Files tab). ' +
    'Use when the user asks to save/attach/upload a file to a company, person, opportunity, or custom object. ' +
    'For AI Chat uploads pass only sourceFileId + objectNameSingular + recordId. ' +
    'The server always keeps the original uploaded filename — do not pass filename with sourceFileId. ' +
    'For MCP raw bytes pass contentBase64 + filename. ' +
    'Do NOT use create_one_attachment or update_one_attachment — those tools are unavailable for file registration. ' +
    'Do NOT reassign an existing attachment by filename. ' +
    'Non-idempotent: calling twice creates two attachments. Requires UPLOAD_FILE permission.';
  inputSchema = RegisterFileOnRecordInputZodSchema;
  flag = PermissionFlagType.UPLOAD_FILE;

  constructor(
    private readonly recordFileRegistrationService: RecordFileRegistrationService,
    private readonly workspaceCacheService: WorkspaceCacheService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async execute(
    parameters: RegisterFileOnRecordInput,
    context: ToolExecutionContext,
  ): Promise<ToolOutput> {
    try {
      const parsed = RegisterFileOnRecordInputZodSchema.safeParse(parameters);

      if (!parsed.success) {
        return {
          success: false,
          message: 'Invalid register_file_on_record input',
          error: parsed.error.issues.map((issue) => issue.message).join('; '),
        };
      }

      if (!isDefined(context.rolePermissionConfig)) {
        return {
          success: false,
          message: 'Missing role permissions for register_file_on_record',
          error:
            'rolePermissionConfig is required. Ensure the tool is invoked through the tool executor.',
        };
      }

      const authContext = await this.resolveAuthContext(context);

      return this.recordFileRegistrationService.registerFileOnRecord({
        input: parsed.data,
        authContext,
        rolePermissionConfig: context.rolePermissionConfig,
        actorContext: context.actorContext ?? {
          source: FieldActorSource.AGENT,
          name: 'Agent',
        },
      });
    } catch (error) {
      this.logger.error(`register_file_on_record failed: ${error}`);

      if (error instanceof AuthException) {
        return {
          success: false,
          message: 'Authentication required to register files',
          error: error.message,
        };
      }

      return {
        success: false,
        message: 'Failed to register file on record',
        error:
          error instanceof Error ? error.message : 'Failed to register file',
      };
    }
  }

  private async resolveAuthContext(
    context: ToolExecutionContext,
  ): Promise<WorkspaceAuthContext> {
    if (isDefined(context.authContext)) {
      return context.authContext;
    }

    if (!isDefined(context.userId) || !isDefined(context.userWorkspaceId)) {
      throw new AuthException(
        'userId and userWorkspaceId are required for register_file_on_record when authContext is missing',
        AuthExceptionCode.UNAUTHENTICATED,
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: context.userId },
    });

    if (!isDefined(user)) {
      throw new AuthException(
        'User not found',
        AuthExceptionCode.UNAUTHENTICATED,
      );
    }

    // Same pattern as ToolExecutorService.buildAuthContext — there is no
    // workspace cache provider key; only flatWorkspaceMemberMaps is valid.
    const { flatWorkspaceMemberMaps } =
      await this.workspaceCacheService.getOrRecompute(context.workspaceId, [
        'flatWorkspaceMemberMaps',
      ]);

    const workspaceMemberId = flatWorkspaceMemberMaps.idByUserId[user.id];
    const workspaceMember = isDefined(workspaceMemberId)
      ? flatWorkspaceMemberMaps.byId[workspaceMemberId]
      : undefined;

    if (!isDefined(workspaceMemberId) || !isDefined(workspaceMember)) {
      throw new AuthException(
        'Workspace member not found',
        AuthExceptionCode.UNAUTHENTICATED,
      );
    }

    return buildUserAuthContext({
      workspace: { id: context.workspaceId } as FlatWorkspace,
      userWorkspaceId: context.userWorkspaceId,
      user: fromUserEntityToFlat(user),
      workspaceMemberId,
      workspaceMember,
    });
  }
}
