/**
 * IPC通信を抽象化するサービスレイヤー
 * window.electronAPIへのアクセスをラップし、テスト時のモック化を容易にする
 */

import type { ImageSet } from "../../shared/types/ImageSet";

/**
 * IPCサービスのインターフェース
 */
export interface IIPCService {
    updateImageSets(imageSets: ImageSet[]): Promise<void>;
    updateUnitFactor(factor: number): Promise<void>;
}

/**
 * 実際のElectron IPC通信を行うサービス
 */
class IPCService implements IIPCService {
    async updateImageSets(imageSets: ImageSet[]): Promise<void> {
        await window.electronAPI.updateImageSets(imageSets);
    }

    async updateUnitFactor(factor: number): Promise<void> {
        await window.electronAPI.updateUnitFactor(factor);
    }
}

/**
 * テスト用モックサービス
 */
export class MockIPCService implements IIPCService {
    public updateImageSetsCalls: ImageSet[][] = [];
    public updateUnitFactorCalls: number[] = [];

    async updateImageSets(imageSets: ImageSet[]): Promise<void> {
        this.updateImageSetsCalls.push(imageSets);
    }

    async updateUnitFactor(factor: number): Promise<void> {
        this.updateUnitFactorCalls.push(factor);
    }

    reset(): void {
        this.updateImageSetsCalls = [];
        this.updateUnitFactorCalls = [];
    }
}

// デフォルトのサービスインスタンス
let ipcServiceInstance: IIPCService = new IPCService();

/**
 * 現在のIPCサービスインスタンスを取得
 */
export const getIPCService = (): IIPCService => ipcServiceInstance;

/**
 * IPCサービスインスタンスを設定（テスト用）
 */
export const setIPCService = (service: IIPCService): void => {
    ipcServiceInstance = service;
};

/**
 * IPCサービスをデフォルトにリセット
 */
export const resetIPCService = (): void => {
    ipcServiceInstance = new IPCService();
};
