import { useEffect, useState } from "react";

import type { LicenseInfo } from "../../../shared/types/LicenseInfo";
import { useIpcService } from "../../providers/IpcServiceProvider";

export const useAboutDialogData = (open: boolean) => {
    const ipcService = useIpcService();
    const [licenses, setLicenses] = useState<LicenseInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [appVersion, setAppVersion] = useState("");

    useEffect(() => {
        if (!open) {
            return;
        }

        let cancelled = false;
        setLoading(true);

        Promise.all([ipcService.getLicenseInfo(), ipcService.getAppVersion()])
            .then(([licenseData, version]) => {
                if (cancelled) {
                    return;
                }
                setLicenses(licenseData);
                setAppVersion(version);
            })
            .catch((error) => {
                if (cancelled) {
                    return;
                }
                try {
                    void ipcService.log.error("Failed to load about info", {
                        error,
                    });
                } catch {
                    // noop
                }
                setLicenses([]);
                setAppVersion("");
            })
            .finally(() => {
                if (cancelled) {
                    return;
                }
                setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [open, ipcService]);

    return { licenses, loading, appVersion };
};
