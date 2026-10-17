import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionsModule } from 'src/engine/metadata-modules/permissions/permissions.module';
import { SmsDispatchEntity } from './sms-dispatch.entity';
import { PpurioService } from './ppurio.service';
import { SmsService } from './sms.service';
import { SmsResolver } from './sms.resolver';
@Module({
  imports: [TypeOrmModule.forFeature([SmsDispatchEntity]), PermissionsModule],
  providers: [PpurioService, SmsService, SmsResolver],
  exports: [SmsService],
})
export class SmsModule {}
