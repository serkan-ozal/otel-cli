import { CommandExecutor } from './CommandExecutor';
import { ExportCommandExecutor } from './export';
import { GenerateIdCommandExecutor } from './generate-id';

export * from './CommandExecutor';

export enum Commands {
    EXPORT = 'export',
    GENERATE_ID = 'generate-id',
}

type CommandExecutorFactory = () => CommandExecutor;

interface CommandExecutorFactoryMap {
    [commandName: string]: () => CommandExecutor;
}

const COMMAND_EXECUTOR_FACTORY_MAP: CommandExecutorFactoryMap = {
    [Commands.EXPORT]: () => new ExportCommandExecutor(),
    [Commands.GENERATE_ID]: () => new GenerateIdCommandExecutor(),
};

export function createCommandExecutor(command: string): CommandExecutor {
    const commandExecutorFactory: CommandExecutorFactory =
        COMMAND_EXECUTOR_FACTORY_MAP[command];
    if (!commandExecutorFactory) {
        throw new Error(`Unrecognized command to execute: ${command}`);
    }
    return commandExecutorFactory();
}
