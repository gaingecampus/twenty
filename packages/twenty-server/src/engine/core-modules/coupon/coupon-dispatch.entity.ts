import { type CouponProviderState } from './sendbee.types';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { WorkspaceRelatedEntity } from 'src/engine/workspace-manager/types/workspace-related-entity';
import {
  type CouponProduct,
  type CouponRecipient,
  type CouponScenario,
} from './coupon.types';

@Entity({ name: 'couponDispatch', schema: 'core' })
@Index('IDX_COUPON_DISPATCH_OWNER', [
  'workspaceId',
  'userWorkspaceId',
  'createdAt',
])
export class CouponDispatchEntity extends WorkspaceRelatedEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @CreateDateColumn({ type: 'timestamptz' }) createdAt: Date;
  @Column({ type: 'uuid' }) userWorkspaceId: string;
  @Column({ type: 'uuid', nullable: true }) listId: string | null;
  @Column({ type: 'varchar', default: 'SIMULATION' }) mode: string;
  @Column({ type: 'varchar', default: 'PREVIEW' }) status: string;
  @Column({ type: 'jsonb' }) product: CouponProduct;
  @Column({ type: 'jsonb' }) recipients: CouponRecipient[];
  @Column({ type: 'varchar' }) scenario: CouponScenario;
  @Column({ type: 'text' }) message: string;
  @Column({ type: 'integer' }) total: number;
  @Column({ type: 'integer' }) missing: number;
  @Column({ type: 'integer' }) duplicates: number;
  @Column({ type: 'integer' }) estimatedCost: number;
  @Column({ type: 'timestamptz' }) expiresAt: Date;
  @Column({ type: 'jsonb', nullable: true })
  provider: CouponProviderState | null;
}
