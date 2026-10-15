import { Module } from '@nestjs/common';

import { GaingeSalesResolver } from 'src/modules/gainge-sales/gainge-sales.resolver';
import { GaingeSalesService } from 'src/modules/gainge-sales/gainge-sales.service';

@Module({
  providers: [GaingeSalesResolver, GaingeSalesService],
})
export class GaingeSalesModule {}
