import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  @Get()
  @ApiOperation({ summary: 'Get notifications' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved' })
  async getNotifications() {
    return { message: 'Get notifications endpoint - to be implemented' };
  }

  @Post('send')
  @ApiOperation({ summary: 'Send notification' })
  @ApiResponse({ status: 201, description: 'Notification sent' })
  async sendNotification(@Body() data: any) {
    return { message: 'Send notification endpoint - to be implemented', data };
  }
}
