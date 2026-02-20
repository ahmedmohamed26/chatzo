import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { PlansModule } from './modules/plans/plans.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { QuickRepliesModule } from './modules/quick-replies/quick-replies.module';
import { ChannelsModule } from './modules/channels/channels.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { TeamModule } from './modules/team/team.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule,
    UsersModule,
    PlansModule,
    SubscriptionsModule,
    OnboardingModule,
    ConversationsModule,
    QuickRepliesModule,
    ChannelsModule,
    TeamModule,
    WebhooksModule,
  ],
})
export class AppModule {}
