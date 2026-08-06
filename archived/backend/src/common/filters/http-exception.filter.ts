import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse: any =
      exception instanceof HttpException ? exception.getResponse() : null;

    let errorMessage = 'Internal server error';
    if (typeof exceptionResponse === 'string') {
      errorMessage = exceptionResponse;
    } else if (exceptionResponse && typeof exceptionResponse === 'object') {
      errorMessage =
        exceptionResponse.message || exceptionResponse.error || errorMessage;
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
    }

    this.logger.error(
      `HTTP Status: ${status} Error Message: ${JSON.stringify(errorMessage)} Path: ${request.url}`,
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      error: errorMessage,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
