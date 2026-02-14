import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/renderer/components/ui/dialog";
import { Button } from "@/renderer/components/ui/button";
import { useTranslation } from "react-i18next";
import { Label } from "@/renderer/components/ui/label";
import { Switch } from "@/renderer/components/ui/switch";
import { useState } from "react";

interface ExportDialogProps {
    open: boolean;
    onClose: () => void;
    onExport: (includeBackground: boolean) => void;
}

export function ExportDialog({ open, onClose, onExport }: ExportDialogProps) {
    const { t } = useTranslation();
    const [includeBackground, setIncludeBackground] = useState(false);

    const exportAndClose = () => {
        onExport(includeBackground);
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {t("render.export_dialog.title", "画像を保存")}
                    </DialogTitle>
                    <DialogDescription>
                        {t(
                            "render.export_dialog.description",
                            "保存オプションを選択してください。"
                        )}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex items-center justify-between space-x-2">
                        <Label
                            htmlFor="include-background"
                            className="flex flex-col space-y-1"
                        >
                            <span>
                                {t(
                                    "render.export_dialog.option.include_background",
                                    "背景を含める"
                                )}
                            </span>
                            <span className="font-normal text-xs text-muted-foreground">
                                {t(
                                    "render.export_dialog.option.include_background_desc",
                                    "ウィンドウの裏にあるデスクトップ画面も一緒に保存します"
                                )}
                            </span>
                        </Label>
                        <Switch
                            id="include-background"
                            checked={includeBackground}
                            onCheckedChange={setIncludeBackground}
                            data-testid="main.export.include-background"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={onClose}
                        data-testid="main.export.cancel"
                    >
                        {t("common.cancel", "キャンセル")}
                    </Button>
                    <Button
                        onClick={exportAndClose}
                        data-testid="main.export.save"
                    >
                        {t("common.save", "保存")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
