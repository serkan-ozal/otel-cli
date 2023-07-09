import { CommandExecutor } from '../CommandExecutor';
import { IdType } from '../../domain/Id';
import { generateSpanId, generateTraceId } from '../../utils';
import * as logger from '../../logger';
import { Commands } from '../index';

import { Command, Option, OptionValues } from 'commander';

export class GenerateIdCommandExecutor implements CommandExecutor {
    private verboseEnabled: boolean;

    commandName(): string {
        return Commands.GENERATE_ID;
    }

    defineOptions(command: Command) {
        command
            .addOption(
                new Option('-v, --verbose', 'Enable verbose mode')
                    .makeOptionMandatory(false)
                    .default(process.env.OTEL_CLI_VERBOSE &&
                        process.env.OTEL_CLI_VERBOSE.toLowerCase() === 'true')
            )
            .addOption(
                new Option('-t, --type <id-type>', 'Type of the id to be generated')
                    .makeOptionMandatory(true)
                    .choices(Object.values(IdType).filter((o) => isNaN(Number(o))))
            );
    }

    async execute(options: OptionValues): Promise<void> {
        this.verboseEnabled = options.verbose;
        logger.setDebugEnabled(this.verboseEnabled);

        switch (options.type) {
            case IdType.TRACE:
                console.log(generateTraceId());
                break;
            case IdType.SPAN:
                console.log(generateSpanId());
                break;
            default:
                throw new Error(`Unrecognized id type: ${options.type}`);
        }
    }

}
