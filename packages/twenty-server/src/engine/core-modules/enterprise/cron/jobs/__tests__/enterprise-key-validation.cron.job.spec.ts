import { type Repository } from 'typeorm';
import { EnterpriseKeyValidationCronJob } from 'src/engine/core-modules/enterprise/cron/jobs/enterprise-key-validation.cron.job';
import { type EnterprisePlanService } from 'src/engine/core-modules/enterprise/services/enterprise-plan.service';
import { type UserWorkspaceEntity } from 'src/engine/core-modules/user-workspace/user-workspace.entity';

describe('EnterpriseKeyValidationCronJob self-hosted mode', () => {
  it('does not renew tokens, report seats, or query members', async () => {
    const service = {
      isSelfHosted: jest.fn().mockReturnValue(true),
      refreshValidityToken: jest.fn(),
      reportSeats: jest.fn(),
    };
    const repository = { count: jest.fn() };
    const job = new EnterpriseKeyValidationCronJob(
      service as unknown as EnterprisePlanService,
      repository as unknown as Repository<UserWorkspaceEntity>,
    );

    await job.handle();

    expect(service.refreshValidityToken).not.toHaveBeenCalled();
    expect(service.reportSeats).not.toHaveBeenCalled();
    expect(repository.count).not.toHaveBeenCalled();
  });
});
