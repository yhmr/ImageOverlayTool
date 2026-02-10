import { createContext, type ReactNode, useContext, useMemo } from "react";

import { getIPCService, type IIPCService } from "../services/ipcService";

const IpcServiceContext = createContext<IIPCService | null>(null);

interface IpcServiceProviderProps {
    children: ReactNode;
    service?: IIPCService;
}

export const IpcServiceProvider = ({
    children,
    service,
}: IpcServiceProviderProps) => {
    const contextValue = useMemo(() => service ?? getIPCService(), [service]);

    return (
        <IpcServiceContext.Provider value={contextValue}>
            {children}
        </IpcServiceContext.Provider>
    );
};

export const useIpcService = (): IIPCService => {
    const contextValue = useContext(IpcServiceContext);
    return contextValue ?? getIPCService();
};
