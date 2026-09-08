import { GaingeAutomationTableService } from './automation-table.service';
import { Module } from '@nestjs/common';
import { SecureHttpClientModule } from 'src/engine/core-modules/secure-http-client/secure-http-client.module';
import { AiModelsModule } from 'src/engine/metadata-modules/ai/ai-models/ai-models.module';
import { GaingeAutomationService } from './gainge-automation.service';
import { GaingeGoogleChatService } from './google-chat.service';
import { GaingeGoogleChatController } from './google-chat.controller';
import { GaingeChatAuthGuard } from './google-chat-auth.guard';
@Module({
  controllers: [GaingeGoogleChatController],
  imports: [SecureHttpClientModule, AiModelsModule],
  providers: [
    GaingeAutomationService,
    GaingeAutomationTableService,
    GaingeGoogleChatService,
    GaingeChatAuthGuard,
  ],
})
export class GaingeAutomationModule {}
