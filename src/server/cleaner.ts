import * as logger from '../logger';
import { exit } from '../exit';
import { ServerController } from './server';

import find from 'find-process';

const ZOMBIE_SERVER_CHECK_PERIOD: number = 5000;

interface ProcessInfo {
    pid: number;
    ppid?: number;
    uid?: number;
    gid?: number;
    name: string;
    cmd: string;
}

async function _getParentProcessInfo(
    ppid: number
): Promise<ProcessInfo | undefined> {
    try {
        const processList: ProcessInfo[] = await find('pid', ppid);
        if (!processList || !processList.length) {
            return undefined;
        } else {
            return processList[0];
        }
    } catch (err: any) {
        logger.error(
            `Error occurred while checking parent process of the OTEL CLI server`
        );
        return undefined;
    }
}

function _hashProcessInfo(processInfo?: ProcessInfo): string {
    if (!processInfo) {
        return '';
    } else {
        return JSON.stringify(processInfo);
    }
}

async function _getParentProcessInfoHash(ppid: number): Promise<string> {
    const parentProcessInfo: ProcessInfo | undefined =
        await _getParentProcessInfo(ppid);
    return _hashProcessInfo(parentProcessInfo);
}

export async function startServerCleaner(
    serverController: ServerController,
    ppid: number
): Promise<void> {
    if (!ppid) {
        return Promise.resolve();
    }

    const cleaner: () => void = async function (): Promise<void> {
        await serverController.shutdown();
        exit(0);
    };

    // Gracefully shutdown server on parent process exit
    const initialParentProcessInfoHash: string =
        await _getParentProcessInfoHash(ppid);
    setInterval(async () => {
        const currentParentProcessInfoHash: string =
            await _getParentProcessInfoHash(ppid);
        if (
            !currentParentProcessInfoHash ||
            initialParentProcessInfoHash != currentParentProcessInfoHash
        ) {
            cleaner();
        }
    }, ZOMBIE_SERVER_CHECK_PERIOD);

    // Gracefully shutdown server on current process exit
    [
        `exit`,
        `uncaughtException`,
        `SIGINT`,
        `SIGTERM`,
        `SIGUSR1`,
        `SIGUSR2`,
    ].forEach((eventType) => {
        process.on(eventType, () => cleaner());
    });
}
