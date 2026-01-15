import { memo, useCallback, useLayoutEffect } from "react";
import { useTranslation } from "react-i18next";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/renderer/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/renderer/components/ui/select";
import { Button } from "@/renderer/components/ui/button";
import { Label } from "@/renderer/components/ui/label";

interface SettingDialogProps {
    open: boolean;
    handleClose: () => void;
}

export const SettingDialog = memo(function SettingDialog(
    props: SettingDialogProps
) {
    const { open, handleClose } = props;
    const { t, i18n } = useTranslation();

    // 言語切り替え
    const handleLanguageChange = useCallback(
        (value: string) => {
            i18n.changeLanguage(value);
        },
        [i18n]
    );

    // 終了時に設定保存
    const handleCloseAndSave = useCallback(async () => {
        // 設定を保存
        await window.electronAPI.saveSetting({
            language: i18n.language,
        });
        handleClose();
    }, [handleClose, i18n]);

    // 初期化
    useLayoutEffect(() => {
        // 設定を読み込み
        const loadSetting = async () => {
            const setting = await window.electronAPI.loadSetting();
            i18n.changeLanguage(setting.language);
        };
        loadSetting();
    }, [i18n]);

    return (
        <Dialog
            open={open}
            onOpenChange={(isOpen) => !isOpen && handleCloseAndSave()}
        >
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{t("render.setting_dlg.title")}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="language-select" className="text-right">
                            {t("render.setting_dlg.language")}
                        </Label>
                        <Select
                            value={i18n.language}
                            onValueChange={handleLanguageChange}
                        >
                            <SelectTrigger
                                className="col-span-3"
                                id="language-select"
                            >
                                <SelectValue
                                    placeholder={t(
                                        "render.setting_dlg.language"
                                    )}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.keys(
                                    i18n.services.resourceStore.data
                                ).map((lng) => (
                                    <SelectItem key={lng} value={lng}>
                                        {lng}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="text-sm text-muted-foreground ml-auto">
                        {t("render.setting_dlg.helper.language")}
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleCloseAndSave}>
                        {t("render.setting_dlg.done")}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
});
