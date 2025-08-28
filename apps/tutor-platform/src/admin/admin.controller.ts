import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved' })
  async getUsers() {
    return { message: 'Get users endpoint - to be implemented' };
  }

  @Get('bookings')
  @ApiOperation({ summary: 'Get all bookings' })
  @ApiResponse({ status: 200, description: 'Bookings retrieved' })
  async getBookings() {
    return { message: 'Get bookings endpoint - to be implemented' };
  }

  @Get('queues')
  @ApiOperation({ summary: 'Get queue status' })
  @ApiResponse({ status: 200, description: 'Queue status retrieved' })
  async getQueues() {
    return { message: 'Get queues endpoint - to be implemented' };
  }
}
