import { Catch, HttpException, type ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { SupportDock } from '../monitoring/client';

/**
 * Nest catches every exception a handler throws, so they never reach the
 * process-level crash handler. This filter reports the ones that are bugs —
 * anything that is not an HttpException, or is one with a 5xx status — then
 * hands over to Nest's default handling, so responses do not change.
 *
 * ```ts
 * const { httpAdapter } = app.get(HttpAdapterHost);
 * app.useGlobalFilters(new SupportDockExceptionFilter(httpAdapter));
 * ```
 */
@Catch()
export class SupportDockExceptionFilter extends BaseExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost): void {
        const status = exception instanceof HttpException ? exception.getStatus() : 500;
        if (status >= 500) {
            let route: string | undefined;
            if (host.getType() === 'http') {
                const req = host.switchToHttp().getRequest<{ method?: string; route?: { path?: string } }>();
                route = `${req?.method ?? 'GET'} ${req?.route?.path ?? '(unmatched)'}`;
            }
            SupportDock.captureException(exception, { route });
        }
        super.catch(exception, host);
    }
}
