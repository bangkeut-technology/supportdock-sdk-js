/**
 * Groups occurrences of the same error. Built from the error's type and the
 * top frames' function and file — never line or column numbers, which move
 * with every unrelated edit and would split one bug into a group per deploy.
 */
export declare function fingerprint(name: string, message: string, stack: string): string;
