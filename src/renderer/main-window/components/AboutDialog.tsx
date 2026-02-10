import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/renderer/components/ui/dialog";
import { Button } from "@/renderer/components/ui/button";
import { ScrollArea } from "@/renderer/components/ui/scroll-area";

import { useIpcService } from "../../providers/IpcServiceProvider";

interface LicenseInfo {
    name: string;
    licenses: string;
    repository: string;
    publisher: string;
    url: string;
}

interface AboutDialogProps {
    open: boolean;
    handleClose: () => void;
}

export function AboutDialog(props: AboutDialogProps) {
    const { open, handleClose } = props;
    const { t } = useTranslation();
    const ipcService = useIpcService();

    const [licenses, setLicenses] = useState<LicenseInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [appVersion, setAppVersion] = useState("");

    useEffect(() => {
        if (open) {
            setLoading(true);
            // ライセンス情報とバージョンを並列で取得
            Promise.all([
                ipcService.getLicenseInfo() as Promise<LicenseInfo[]>,
                ipcService.getAppVersion(),
            ])
                .then(([licenseData, version]) => {
                    setLicenses(licenseData);
                    setAppVersion(version);
                })
                .catch((error) => {
                    console.error("Failed to load about info:", error);
                    setLicenses([]);
                    setAppVersion("");
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [open, ipcService]);

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>{t("render.about_dlg.title")}</DialogTitle>
                    <DialogDescription className="sr-only">
                        This dialog shows information about the application and
                        licenses of third-party libraries.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {/* バージョン情報 */}
                    <div className="text-center">
                        <h2 className="text-xl font-bold">ImageOverlayTool</h2>
                        <p className="text-sm text-muted-foreground">
                            {t("render.about_dlg.version")}: {appVersion}
                        </p>
                    </div>

                    {/* ライセンス一覧 */}
                    <div>
                        <h3 className="text-sm font-semibold mb-2">
                            {t("render.about_dlg.licenses")}
                        </h3>
                        <ScrollArea className="h-[300px] rounded-md border p-2">
                            {loading ? (
                                <p className="text-sm text-muted-foreground">
                                    Loading...
                                </p>
                            ) : licenses.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No license information available
                                </p>
                            ) : (
                                <div className="space-y-3">
                                    {licenses.map((license, index) => {
                                        // "package@version" 形式の分割ロジック
                                        // スコープパッケージ (@org/pkg@1.2.3) に対応
                                        const lastAtIndex =
                                            license.name.lastIndexOf("@");
                                        let name = license.name;
                                        let version = "";

                                        if (
                                            lastAtIndex > 0 &&
                                            lastAtIndex <
                                                license.name.length - 1
                                        ) {
                                            name = license.name.substring(
                                                0,
                                                lastAtIndex
                                            );
                                            version = license.name.substring(
                                                lastAtIndex + 1
                                            );
                                        }

                                        return (
                                            <div
                                                key={index}
                                                className="text-xs border-b pb-2 last:border-b-0"
                                            >
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <div className="font-bold text-sm">
                                                        {name}
                                                    </div>
                                                    {version && (
                                                        <div className="text-muted-foreground ml-2">
                                                            v{version}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex justify-between text-muted-foreground italic">
                                                    <div>
                                                        {license.licenses}
                                                    </div>
                                                    {license.publisher && (
                                                        <div className="text-[10px] opacity-70">
                                                            {license.publisher}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </ScrollArea>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleClose}>
                        {t("render.about_dlg.done")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
