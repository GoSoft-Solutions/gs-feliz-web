import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

/**
 * Attaches a unique request ID to every incoming request, echoes it back
 * as a response header, and makes it available to loggers/exception
 * filters so a single request can be traced end-to-end in logs.
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request & { id?: string }, res: Response, next: NextFunction): void {
    const incomingId = req.headers['x-request-id'];
    const requestId = typeof incomingId === 'string' && incomingId.length > 0 ? incomingId : randomUUID();

    req.id = requestId;
    res.setHeader('X-Request-Id', requestId);
    next();
  }
}
