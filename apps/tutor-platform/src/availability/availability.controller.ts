import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';

@ApiTags('availability')
@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get()
  @ApiOperation({ summary: 'Get all availabilities' })
  @ApiResponse({ status: 200, description: 'Availabilities retrieved' })
  @ApiQuery({ name: 'providerId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getAvailabilities(
    @Query('providerId') providerId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (providerId) {
      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;
      const results = await this.availabilityService.getProviderAvailability(providerId, start, end);
      return {
        success: true,
        data: results,
        total: results.length,
      };
    }
    
    return {
      success: true,
      message: 'Provider ID required to get availabilities',
      data: [],
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get availability by ID' })
  @ApiResponse({ status: 200, description: 'Availability found' })
  async getAvailability(@Param('id') id: string) {
    // TODO: Implement get availability by ID
    return {
      success: true,
      message: 'Get availability by ID endpoint - to be implemented',
      id,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create availability' })
  @ApiResponse({ status: 201, description: 'Availability created' })
  @ApiBearerAuth()
  async createAvailability(@Body() data: any, @Request() req: any) {
    // TODO: Get providerId from authenticated user
    const providerId = req.user?.id || 'temp-provider-id';
    const availability = await this.availabilityService.createAvailability(providerId, data);
    return {
      success: true,
      data: availability,
      message: 'Availability created successfully',
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update availability' })
  @ApiResponse({ status: 200, description: 'Availability updated' })
  @ApiBearerAuth()
  async updateAvailability(@Param('id') id: string, @Body() data: any) {
    const availability = await this.availabilityService.updateAvailability(id, data);
    return {
      success: true,
      data: availability,
      message: 'Availability updated successfully',
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete availability' })
  @ApiResponse({ status: 200, description: 'Availability deleted' })
  @ApiBearerAuth()
  async deleteAvailability(@Param('id') id: string) {
    await this.availabilityService.deleteAvailability(id);
    return {
      success: true,
      message: 'Availability deleted successfully',
    };
  }

  @Get('schedule/:providerId')
  @ApiOperation({ summary: 'Get provider schedule' })
  @ApiResponse({ status: 200, description: 'Schedule retrieved' })
  async getProviderSchedule(@Param('providerId') providerId: string) {
    const schedule = await this.availabilityService.getProviderSchedule(providerId);
    return {
      success: true,
      data: schedule,
      total: schedule.length,
    };
  }

  @Post('check')
  @ApiOperation({ summary: 'Check availability for a time slot' })
  @ApiResponse({ status: 200, description: 'Availability checked' })
  async checkAvailability(
    @Body() data: { providerId: string; startTime: string; endTime: string },
  ) {
    const isAvailable = await this.availabilityService.checkAvailability(
      data.providerId,
      new Date(data.startTime),
      new Date(data.endTime),
    );
    return {
      success: true,
      data: { isAvailable },
      message: isAvailable ? 'Time slot is available' : 'Time slot is not available',
    };
  }
}
