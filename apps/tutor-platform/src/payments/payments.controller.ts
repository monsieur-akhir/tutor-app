import { Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PaymentsService, CreatePaymentDto, ConfirmPaymentDto } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new payment' })
  @ApiResponse({ status: 201, description: 'Payment created successfully' })
  @ApiBearerAuth()
  async createPayment(@Body() data: CreatePaymentDto) {
    const payment = await this.paymentsService.createPayment(data);
    return {
      success: true,
      data: payment,
      message: 'Payment created successfully',
    };
  }

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm a payment (Admin only)' })
  @ApiResponse({ status: 200, description: 'Payment confirmed successfully' })
  @ApiBearerAuth()
  async confirmPayment(@Body() data: ConfirmPaymentDto) {
    const payment = await this.paymentsService.confirmPayment(data);
    return {
      success: true,
      data: payment,
      message: 'Payment confirmed successfully',
    };
  }

  @Put(':id/reject')
  @ApiOperation({ summary: 'Reject a payment (Admin only)' })
  @ApiResponse({ status: 200, description: 'Payment rejected successfully' })
  @ApiBearerAuth()
  async rejectPayment(
    @Param('id') paymentId: string,
    @Body() data: { reason: string; adminId: string },
  ) {
    const payment = await this.paymentsService.rejectPayment(paymentId, data.adminId, data.reason);
    return {
      success: true,
      data: payment,
      message: 'Payment rejected successfully',
    };
  }

  @Put(':id/cancel')
  @ApiOperation({ summary: 'Cancel a payment (Admin only)' })
  @ApiResponse({ status: 200, description: 'Payment cancelled successfully' })
  @ApiBearerAuth()
  async cancelPayment(
    @Param('id') paymentId: string,
    @Body() data: { reason: string; adminId: string },
  ) {
    const payment = await this.paymentsService.cancelPayment(paymentId, data.adminId, data.reason);
    return {
      success: true,
      data: payment,
      message: 'Payment cancelled successfully',
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment found' })
  @ApiBearerAuth()
  async getPayment(@Param('id') paymentId: string) {
    const payment = await this.paymentsService.getPayment(paymentId);
    return {
      success: true,
      data: payment,
    };
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user payments' })
  @ApiResponse({ status: 200, description: 'User payments retrieved' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'confirmed', 'rejected', 'cancelled'] })
  @ApiBearerAuth()
  async getUserPayments(
    @Param('userId') userId: string,
    @Query('status') status?: string,
  ) {
    const payments = await this.paymentsService.getUserPayments(userId, status as any);
    return {
      success: true,
      data: payments,
      total: payments.length,
    };
  }

  @Get('provider/:providerId')
  @ApiOperation({ summary: 'Get provider payments' })
  @ApiResponse({ status: 200, description: 'Provider payments retrieved' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'confirmed', 'rejected', 'cancelled'] })
  @ApiBearerAuth()
  async getProviderPayments(
    @Param('providerId') providerId: string,
    @Query('status') status?: string,
  ) {
    const payments = await this.paymentsService.getProviderPayments(providerId, status as any);
    return {
      success: true,
      data: payments,
      total: payments.length,
    };
  }

  @Get('pending/all')
  @ApiOperation({ summary: 'Get all pending payments (Admin only)' })
  @ApiResponse({ status: 200, description: 'Pending payments retrieved' })
  @ApiBearerAuth()
  async getPendingPayments() {
    const payments = await this.paymentsService.getPendingPayments();
    return {
      success: true,
      data: payments,
      total: payments.length,
    };
  }



  @Get('stats/overview')
  @ApiOperation({ summary: 'Get payment statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Payment statistics retrieved' })
  @ApiBearerAuth()
  async getPaymentStats() {
    const stats = await this.paymentsService.getPaymentStats();
    return {
      success: true,
      data: stats,
    };
  }
}
