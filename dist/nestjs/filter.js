"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportDockExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const client_1 = require("../monitoring/client");
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
let SupportDockExceptionFilter = class SupportDockExceptionFilter extends core_1.BaseExceptionFilter {
    catch(exception, host) {
        const status = exception instanceof common_1.HttpException ? exception.getStatus() : 500;
        if (status >= 500) {
            let route;
            if (host.getType() === 'http') {
                const req = host.switchToHttp().getRequest();
                route = `${req?.method ?? 'GET'} ${req?.route?.path ?? '(unmatched)'}`;
            }
            client_1.SupportDock.captureException(exception, { route });
        }
        super.catch(exception, host);
    }
};
exports.SupportDockExceptionFilter = SupportDockExceptionFilter;
exports.SupportDockExceptionFilter = SupportDockExceptionFilter = __decorate([
    (0, common_1.Catch)()
], SupportDockExceptionFilter);
