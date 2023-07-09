import * as logger from './logger';

export type ExitHook = (code: number) => Promise<void>;

const exitHooks: ExitHook[] = [];

export function registerExitHook(exitHook: ExitHook): void {
    exitHooks.push(exitHook);
}

export async function exit(code: number = 1): Promise<void> {
    for (let exitHook of exitHooks) {
        try {
            await exitHook(code);
        } catch (err: any) {
            logger.error(
                `Error occurred while calling exit hook ${exitHook.name}`,
                err
            );
        }
    }
    process.exit(code);
}
