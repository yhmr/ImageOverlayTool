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

    useEffect(() => {
        if (open) {
            setLoading(true);
            window.electronAPI
                .getLicenseInfo()
                .then((data) => {
                    setLicenses(data);
                })
                .catch((error) => {
                    console.error("Failed to load licenses:", error);
                    setLicenses([]);
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
                            {t("render.about_dlg.version")}: 0.1.0
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
