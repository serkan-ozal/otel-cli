import { Command, OptionValues } from 'commander';

export interface CommandExecutor {
    commandName(): string;
    defineOptions(command: Command): void;
    execute(options: OptionValues): Promise<void>;
}
