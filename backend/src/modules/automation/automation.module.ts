import { Module } from '@nestjs/common';
import { AutomationStubService } from './automation.stub.service';

@Module({
  providers: [AutomationStubService],
  exports: [AutomationStubService],
})
export class AutomationModule {}
