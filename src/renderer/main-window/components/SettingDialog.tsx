import React, { memo, useCallback, useLayoutEffect } from "react";

import { useTranslation } from "react-i18next";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
} from "@mui/material";

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
    async (e: SelectChangeEvent<string>) => {
      i18n.changeLanguage(e.target.value);
    },
    [i18n]
  );

  // 終了時に設定保存
  const handleCloseAndSave = useCallback(async () => {
    // 設定を保存
    await window.electronAPI.saveSetting({
      language: i18n.language,
      // unit_factor removed
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
      onClose={handleCloseAndSave}
      fullWidth={true}
      maxWidth="xs"
    >
      <DialogTitle>{t("render.setting_dlg.title")}</DialogTitle>
      <DialogContent>
        <FormControl fullWidth sx={{ mt: 2 }}>
          {/* 言語設定 */}
          <InputLabel id="language-select-label">
            {t("render.setting_dlg.language")}
          </InputLabel>
          <Select
            labelId="language-select-label"
            id="language-select"
            value={i18n.language}
            label={t("render.setting_dlg.language")}
            onChange={handleLanguageChange}
          >
            {Object.keys(i18n.services.resourceStore.data).map((lng) => {
              return (
                <MenuItem key={lng} value={lng}>
                  {lng}
                </MenuItem>
              );
            })}
          </Select>
          <FormHelperText>
            {t("render.setting_dlg.helper.language")}
          </FormHelperText>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseAndSave}>
          {t("render.setting_dlg.done")}
        </Button>
      </DialogActions>
    </Dialog>
  );
});
