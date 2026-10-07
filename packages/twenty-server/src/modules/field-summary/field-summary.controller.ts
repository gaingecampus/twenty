import { RestApiExceptionFilter } from 'src/engine/api/rest/rest-api-exception.filter';
import { PermissionsRestApiExceptionFilter } from 'src/engine/metadata-modules/permissions/utils/permissions-rest-api-exception.filter';
import { AiRestApiExceptionFilter } from 'src/engine/metadata-modules/ai/filters/ai-api-exception.filter';
import { CustomPermissionGuard } from 'src/engine/guards/custom-permission.guard';
import {
  Controller,
  ForbiddenException,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
  UseFilters,
} from '@nestjs/common';
import { type Request } from 'express';
import { JwtAuthGuard } from 'src/engine/guards/jwt-auth.guard';
import { WorkspaceAuthGuard } from 'src/engine/guards/workspace-auth.guard';
import { buildUserAuthContext } from 'src/engine/core-modules/auth/utils/build-user-auth-context.util';
import { FieldSummaryService } from './field-summary.service';

@Controller('rest/field-summary')
@UseFilters(
  PermissionsRestApiExceptionFilter,
  AiRestApiExceptionFilter,
  RestApiExceptionFilter,
)
@UseGuards(JwtAuthGuard, WorkspaceAuthGuard)
export class FieldSummaryController {
  constructor(private readonly summaries: FieldSummaryService) {}

  @Post(':contractId')
  // Record and field read permissions are enforced by the workspace repositories.
  @UseGuards(CustomPermissionGuard)
  summarize(
    @Param('contractId', ParseUUIDPipe) contractId: string,
    @Req() request: Request,
  ) {
    const {
      workspace,
      user,
      userWorkspaceId,
      workspaceMemberId,
      workspaceMember,
    } = request;
    if (
      !workspace ||
      !user ||
      !userWorkspaceId ||
      !workspaceMemberId ||
      !workspaceMember
    )
      throw new ForbiddenException();
    return this.summaries.summarize(
      contractId,
      buildUserAuthContext({
        workspace,
        user,
        userWorkspaceId,
        workspaceMemberId,
        workspaceMember,
      }),
    );
  }
}
