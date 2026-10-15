import { BadRequestException, Injectable } from '@nestjs/common';
import { type EmailAttachment, FileFolder } from 'twenty-shared/types';
import { In } from 'typeorm';

import { FileEntity } from 'src/engine/core-modules/file/entities/file.entity';
import { FileService } from 'src/engine/core-modules/file/services/file.service';
import { type EmailingDomainAttachment } from 'src/engine/core-modules/emailing-domain/drivers/types/emailing-domain-attachment.type';
import { InjectWorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/inject-workspace-scoped-repository.decorator';
import { WorkspaceScopedRepository } from 'src/engine/twenty-orm/workspace-scoped-repository/workspace-scoped-repository';
import { streamToBuffer } from 'src/utils/stream-to-buffer';

@Injectable()
export class CampaignAttachmentsService {
  constructor(
    @InjectWorkspaceScopedRepository(FileEntity)
    private readonly files: WorkspaceScopedRepository<FileEntity>,
    private readonly fileService: FileService,
  ) {}

  async load(workspaceId: string, files: EmailAttachment[]) {
    if (files.length === 0) return [];
    const entities = await this.files.find(workspaceId, {
      where: { id: In(files.map((file) => file.id)) },
    });
    const byId = new Map(entities.map((file) => [file.id, file]));
    if (
      files.length > 20 ||
      files.some((file) => !byId.has(file.id)) ||
      files.reduce(
        (total, file) => total + Number(byId.get(file.id)?.size ?? 0),
        0,
      ) >
        25 * 1024 * 1024
    ) {
      throw new BadRequestException(
        '첨부 파일을 확인하세요. 최대 20개, 총 25MB까지 첨부할 수 있습니다.',
      );
    }
    const attachments: EmailingDomainAttachment[] = [];
    for (const file of files) {
      const source = await this.fileService.getFileStreamById({
        workspaceId,
        fileId: file.id,
        allowedFileFolders: [FileFolder.EmailAttachment],
      });
      if (!source)
        throw new BadRequestException(
          '첨부 파일을 찾을 수 없습니다. 다시 업로드하세요.',
        );
      attachments.push({
        filename: file.name,
        content: await streamToBuffer(source.stream),
        contentType: byId.get(file.id)?.mimeType ?? 'application/octet-stream',
      });
    }
    return attachments;
  }

  async retain(workspaceId: string, files: EmailAttachment[]) {
    if (files.length === 0) return;
    // Scheduled mail must retain uploads beyond the temporary-file cleanup window.
    await this.load(workspaceId, files);
    await this.files.update(
      workspaceId,
      { id: In(files.map((file) => file.id)) },
      {
        settings: { isTemporaryFile: false, toDelete: false },
      },
    );
  }
}
