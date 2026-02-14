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
import { VisuallyHidden } from "@/renderer/components/ui/visually-hidden";
import logo from "@assets/icon.png";

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
    onClose: () => void;
}

export function AboutDialog(props: AboutDialogProps) {
    const { open, onClose } = props;
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
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
                <DialogHeader>
                    <VisuallyHidden>
                        <DialogTitle>{t("render.about_dlg.title")}</DialogTitle>
                    </VisuallyHidden>
                    <DialogDescription className="sr-only">
                        This dialog shows information about the application and
                        licenses of third-party libraries.
                    </DialogDescription>
                </DialogHeader>
                <div className="flex-1 flex flex-col min-h-0 py-4 gap-4">
                    {/* バージョン情報 */}
                    <div className="flex-shrink-0 flex flex-col items-center gap-2 text-center">
                        <img
                            src={logo}
                            alt="Logo"
                            className="w-16 h-16 drop-shadow-sm"
                        />
                        <div>
                            <h2 className="text-xl font-bold">
                                ImageOverlayTool
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {t("render.about_dlg.version")}: {appVersion}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Copyright &copy; 2026 yhmr
                            </p>
                        </div>
                        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
                            <a
                                href="https://yhmr.github.io/ImageOverlayTool/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline"
                                data-testid="main.about.link.official-site"
                            >
                                Official Site
                            </a>
                            <a
                                href="https://github.com/yhmr/ImageOverlayTool"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline"
                                data-testid="main.about.link.github"
                            >
                                GitHub
                            </a>
                            <a
                                href="https://github.com/yhmr/ImageOverlayTool/issues"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline"
                                data-testid="main.about.link.issue"
                            >
                                Report Issue
                            </a>
                            <a
                                href="https://yhmr.github.io/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-primary hover:underline"
                                data-testid="main.about.link.developer"
                            >
                                Developer
                            </a>
                        </div>
                    </div>

                    {/* ライセンス一覧 */}
                    <div className="flex-1 flex flex-col min-h-0">
                        <h3 className="text-sm font-semibold mb-2 flex-shrink-0">
                            {t("render.about_dlg.licenses")}
                        </h3>
                        <div className="flex-1 overflow-y-auto rounded-md border p-2">
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
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={onClose} data-testid="main.about.done">
                        {t("render.about_dlg.done")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
