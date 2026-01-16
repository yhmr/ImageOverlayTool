import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/renderer/components/ui/dialog";
import { Button } from "@/renderer/components/ui/button";
import { ScrollArea } from "@/renderer/components/ui/scroll-area";

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
    const [licenses, setLicenses] = useState<LicenseInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [appVersion, setAppVersion] = useState("");

    useEffect(() => {
        if (open) {
            setLoading(true);
            // ライセンス情報とバージョンを並列で取得
            Promise.all([
                window.electronAPI.getLicenseInfo(),
                window.electronAPI.getAppVersion(),
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
    }, [open]);

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
            <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>{t("render.about_dlg.title")}</DialogTitle>
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
                                <div className="space-y-2">
                                    {licenses.map((license, index) => (
                                        <div
                                            key={index}
                                            className="text-xs border-b pb-2 last:border-b-0"
                                        >
                                            <div className="font-medium">
                                                {license.name}
                                            </div>
                                            <div className="text-muted-foreground">
                                                {license.licenses}
                                            </div>
                                        </div>
                                    ))}
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
