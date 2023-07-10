import { ChildProcessWithoutNullStreams } from "child_process";

export type ServiceName = string;
export type TaskContext = Record<
  ServiceName,
  Partial<{
    error: string;
    process: ChildProcessWithoutNullStreams | null;
  }>
>;
