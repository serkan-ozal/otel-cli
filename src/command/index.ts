import { CommandExecutor } from './CommandExecutor';
import { ExportCommandExecutor } from './export';
import { GenerateIdCommandExecutor } from './generate-id';
import {
    ShutdownServerCommandExecutor,
    StartServerCommandExecutor,
} from './server';

export * from './CommandExecutor';

export enum Commands {
    EXPORT = 'export',
    GENERATE_ID = 'generate-id',
    START_SERVER = 'start-server',
    SHUTDOWN_SERVER = 'shutdown-server',
}

type CommandExecutorFactory = () => CommandExecutor;

interface CommandExecutorFactoryMap {
    [commandName: string]: () => CommandExecutor;
}

const COMMAND_EXECUTOR_FACTORY_MAP: CommandExecutorFactoryMap = {
    [Commands.EXPORT]: () => new ExportCommandExecutor(),
    [Commands.GENERATE_ID]: () => new GenerateIdCommandExecutor(),
    [Commands.START_SERVER]: () => new StartServerCommandExecutor(),
    [Commands.SHUTDOWN_SERVER]: () => new ShutdownServerCommandExecutor(),
};

export function createCommandExecutor(command: string): CommandExecutor {
    const commandExecutorFactory: CommandExecutorFactory =
        COMMAND_EXECUTOR_FACTORY_MAP[command];
    if (!commandExecutorFactory) {
        throw new Error(`Unrecognized command to execute: ${command}`);
    }
    return commandExecutorFactory();
}
