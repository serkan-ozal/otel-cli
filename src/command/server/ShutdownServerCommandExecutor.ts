import { Commands } from '../index';
import { CommandExecutor } from '../CommandExecutor';
import * as logger from '../../logger';
import { exit } from '../../exit';
import { DEFAULT_SERVER_HOST, DEFAULT_SERVER_PORT } from '../../constants';

import { Command, Option, OptionValues } from 'commander';
import axios, { AxiosError, AxiosResponse } from 'axios';

const SHUTDOWN_REQUEST_TIMEOUT: number = 30000;

export class ShutdownServerCommandExecutor implements CommandExecutor {
    private verboseEnabled: boolean;
    private serverPort: number;

    commandName(): string {
        return Commands.SHUTDOWN_SERVER;
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
                new Option('-sp, --server-port <port>',
                    'OTEL CLI server port for communicating over to shutdown gracefully')
                    .makeOptionMandatory(false)
                    .default(process.env.OTEL_CLI_SERVER_PORT || DEFAULT_SERVER_PORT)
            );
    }

    private _parseOptions(options: OptionValues): void {
        this.verboseEnabled = options.verbose;
        logger.setDebugEnabled(this.verboseEnabled);

        this.serverPort = parseInt(options.serverPort);
    }

    private _checkOptions(): void {
        if (!this.serverPort) {
            logger.error('OTEL CLI server port must be specified!');
            exit(1);
        }
    }

    async execute(options: OptionValues): Promise<void> {
        this._parseOptions(options);

        this._checkOptions();

        const serverURL: string = `http://${DEFAULT_SERVER_HOST}:${this.serverPort}/shutdown`;
        try {
            const res: AxiosResponse = await axios.delete(serverURL, { timeout: SHUTDOWN_REQUEST_TIMEOUT });
            if (res.status / 100 != 2) {
                throw new Error(
                    `Invalid response (status code=${res.status}) from server endpoint ${serverURL}`
                );
            }
        } catch (err: AxiosError | any) {
            if (err?.response?.status) {
                throw new Error(
                    `Invalid response (status code=${err?.response?.status}) from server endpoint ${serverURL}`
                );
            } else {
                throw new Error(
                    `Unable to shutdown server through endpoint ${serverURL}: ${err.name} (${err.message})`
                );
            }
        }
    }

}
