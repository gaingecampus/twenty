import { Process } from 'src/engine/core-modules/message-queue/decorators/process.decorator';
import { Processor } from 'src/engine/core-modules/message-queue/decorators/processor.decorator';
import { MessageQueue } from 'src/engine/core-modules/message-queue/message-queue.constants';
import { SEND_SMS_JOB, SmsService } from './sms.service';
@Processor(MessageQueue.emailQueue)
export class SendSmsJob {
  constructor(private readonly sms: SmsService) {}
  @Process(SEND_SMS_JOB)
  async handle(data: { workspaceId: string; dispatchId: string }) {
    await this.sms.process(data.workspaceId, data.dispatchId);
  }
}
