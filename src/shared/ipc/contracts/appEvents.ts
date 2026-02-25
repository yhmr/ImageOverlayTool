import { defineEventContract, type EventContract } from "../contract";
import { IPC_EVENTS } from "../channels";

export type AppEventContracts = {
    fileOpen: EventContract<[payload: { filePath: string; ext: string }]>;
};

export const appEventContracts: AppEventContracts = {
    fileOpen: defineEventContract(IPC_EVENTS.fileOpen),
};
