/**
 * contextBridgeで安全に公開された window.electronAPI へアクセスするためのラッパー関数
 */
export const getElectronApi = (): Window["electronAPI"] => window.electronAPI;
