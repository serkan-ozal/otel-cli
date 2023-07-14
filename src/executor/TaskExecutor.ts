type Task<I, O> = (input: I) => Promise<O> | undefined;

type ItemTask<I, O> = {
    readonly task: Task<I, O>;
    readonly input?: I;
    readonly resolve?: ((result: O) => void) | undefined;
    readonly reject?: ((reason: any) => void) | undefined;
};

const CLOSE_CHECK_INTERVAL: number = 500;

export class TaskExecutor {
    private readonly concurrencyLevel: number;
    private queuedTasks: ItemTask<any, any>[];
    private activeWorkerCount: number = 0;
    private closed: boolean = false;

    constructor(concurrencyLevel: number) {
        this.concurrencyLevel = concurrencyLevel;
        this.queuedTasks = [];
    }

    private _executeTask<I, O>(taskItem: ItemTask<I, O>): void {
        this.activeWorkerCount++;
        try {
            const taskPromise: Promise<O> | undefined = taskItem.task(
                taskItem.input as I
            );
            if (taskPromise) {
                taskPromise
                    .then((result: O): void => {
                        if (taskItem.resolve) {
                            taskItem.resolve(result);
                        }
                    })
                    .catch((error: any): void => {
                        if (taskItem.reject) {
                            taskItem.reject(error);
                        }
                    })
                    .finally((): void => {
                        this.activeWorkerCount--;

                        process.nextTick(() => {
                            if (this.queuedTasks.length) {
                                const taskItem: ItemTask<any, any> | undefined =
                                    this.queuedTasks.shift();
                                if (taskItem) {
                                    this._executeTask(taskItem);
                                }
                            }
                        });
                    });
            } else {
                this.activeWorkerCount--;
                if (taskItem.resolve) {
                    taskItem.resolve(null as O);
                }
            }
        } catch (error: any) {
            this.activeWorkerCount--;
            if (taskItem.reject) {
                taskItem.reject(error);
            }
        }
    }

    async execute<I, O>(task: Task<I, O>, input?: I): Promise<O> {
        if (this.closed) {
            throw new Error('Task executor was closed');
        }
        let resolve: ((result: O) => void) | undefined = undefined;
        let reject: ((reason: any) => void) | undefined = undefined;
        const promise: Promise<O> = new Promise(
            (res: (result: O) => void, rej: (reason: any) => void): void => {
                resolve = res;
                reject = rej;
            }
        );
        const itemTask: ItemTask<I, O> = {
            task,
            input,
            resolve,
            reject,
        };
        if (this.activeWorkerCount >= this.concurrencyLevel) {
            this.queuedTasks.push(itemTask);
        } else {
            this._executeTask(itemTask);
        }
        return promise;
    }

    async close(): Promise<void> {
        if (this.closed) {
            return Promise.resolve();
        }
        this.closed = true;
        return new Promise(
            (res: (result: any) => void, rej: (reason: any) => void): void => {
                const intervalId: NodeJS.Timeout = setInterval(() => {
                    if (!this.activeWorkerCount) {
                        clearInterval(intervalId);
                        res(null);
                    }
                }, CLOSE_CHECK_INTERVAL);
            }
        );
    }
}
