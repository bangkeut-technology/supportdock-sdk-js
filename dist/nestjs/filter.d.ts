import { type ArgumentsHost } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
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
export declare class SupportDockExceptionFilter extends BaseExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost): void;
}
