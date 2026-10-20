"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectRelease = detectRelease;
/**
 * Which build is running. Explicit option first, then the variable we document,
 * then what common platforms set on their own, then the package version.
 */
const CANDIDATES = [
    'SUPPORTDOCK_RELEASE',
    'GIT_SHA',
    'GIT_COMMIT',
    'SOURCE_VERSION', // Heroku, Render
    'VERCEL_GIT_COMMIT_SHA',
    'RAILWAY_GIT_COMMIT_SHA',
    'GITHUB_SHA',
    'npm_package_version',
];
function detectRelease(explicit) {
    if (explicit)
        return explicit.slice(0, 128);
    const env = typeof process !== 'undefined' ? process.env : undefined;
    for (const key of CANDIDATES) {
        const value = env?.[key];
        if (value)
            return (key.endsWith('SHA') || key === 'SOURCE_VERSION' ? value.slice(0, 12) : value).slice(0, 128);
    }
    return 'unknown';
}
