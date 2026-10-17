import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';

export type SmsTarget = {
  to: string;
  name: string;
  company?: string;
  content: string;
  messageType: 'SMS' | 'LMS';
};
export type SmsBatch = {
  targets: SmsTarget[];
  status: 'QUEUED' | 'SENDING' | 'ACCEPTED' | 'FAILED' | 'UNKNOWN';
  refKey: string;
  messageKey?: string;
  error?: string;
};

@Entity({ name: 'smsDispatch', schema: 'core' })
@Index('IDX_SMS_DISPATCH_REQUEST', ['workspaceId', 'requestId'], {
  unique: true,
})
export class SmsDispatchEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @UpdateDateColumn({ type: 'timestamptz' }) updatedAt: Date;
  @Column({ type: 'uuid' }) requestId: string;
  @Column({ type: 'uuid' }) userWorkspaceId: string;
  @Column({ type: 'uuid', nullable: true }) listId: string | null;
  @Column({ type: 'varchar' }) subject: string;
  @Column({ type: 'text' }) content: string;
  @Column({ type: 'varchar' }) from: string;
  @Column({ type: 'boolean', default: false }) advertising: boolean;
  @Column({ type: 'jsonb' }) batches: SmsBatch[];
  @Column({ type: 'varchar', default: 'QUEUED' }) status: string;
}
