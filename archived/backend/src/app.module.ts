import { Module, NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HighwaysModule } from './modules/highways/highways.module';
import { AuthMiddleware } from './common/middleware/auth.middleware';

@Module({
  imports: [AuthModule, UsersModule, HighwaysModule],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(
        { path: 'users*', method: RequestMethod.ALL },
        { path: 'highways*', method: RequestMethod.ALL },
      );
  }
}
