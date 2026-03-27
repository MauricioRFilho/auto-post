import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global exception filter to standardize error responses following RFC 7807 (Problem Details for HTTP APIs).
 * https://tools.ietf.org/html/rfc7807
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const isHttpException = exception instanceof HttpException;
    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse: any = isHttpException
      ? exception.getResponse()
      : { message: 'Internal server error' };

    // Standard RFC 7807 response
    const errorResponse = {
      type: `https://httpstatuses.com/${status}`,
      title: this.getDefaultTitle(status),
      status: status,
      detail: typeof exceptionResponse === 'string' 
        ? exceptionResponse 
        : exceptionResponse.message || exception.message,
      instance: request.url,
      ...(typeof exceptionResponse === 'object' && exceptionResponse.error && {
        error: exceptionResponse.error
      }),
      // Support for validation errors (class-validator)
      ...(Array.isArray(exceptionResponse.message) && {
        errors: exceptionResponse.message
      }),
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(errorResponse);
  }

  private getDefaultTitle(status: number): string {
    switch (status) {
      case 400: return 'Bad Request';
      case 401: return 'Unauthorized';
      case 403: return 'Forbidden';
      case 404: return 'Not Found';
      case 409: return 'Conflict';
      case 422: return 'Unprocessable Entity';
      case 500: return 'Internal Server Error';
      default: return 'An error occurred';
    }
  }
}
