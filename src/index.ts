#! /usr/bin/env node

import { OTEL_CLI_NAME, OTEL_CLI_VERSION } from './constants';
import { Commands, CommandExecutor, createCommandExecutor } from './command';

import { Command, OptionValues, program } from 'commander';

program
    .name(OTEL_CLI_NAME)
    .description(
        'OTEL CLI is a command-line tool for sending OpenTelemetry traces'
    )
    .version(OTEL_CLI_VERSION);

for (let commandName of Object.values(Commands).filter((o) =>
    isNaN(Number(o))
)) {
    const commandExecutor: CommandExecutor = createCommandExecutor(commandName);
    const command: Command = program.command(commandName);
    commandExecutor.defineOptions(command);
    command.action(async (options: OptionValues) => {
        await commandExecutor.execute(options);
    });
}

program.parse();
