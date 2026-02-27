export const STARTUP_OPTION_TOKENS = new Set([
    "--scene",
    "--images",
    "--opacity",
    "--position",
    "--size",
    "--always-on-top",
    "--click-through",
    "--fullscreen",
    "--silent",
    "--minimize",
]);

export const CONTROL_COMMAND_OPTION_TOKENS = new Set([
    "--add-image",
    "--set-opacity",
    "--switch-scene",
    "--export",
    "--wait-stable",
]);

export const GLOBAL_OPTION_TOKENS = new Set(["--non-interactive"]);

const ELECTRON_INTERNAL_OPTION_EXACT = new Set([
    "--allow-file-access-from-files",
]);

const ELECTRON_INTERNAL_OPTION_PREFIXES = [
    "--inspect",
    "--remote-debugging-port",
    "--secure-schemes=",
    "--standard-schemes=",
];

export const isElectronInternalOption = (token: string): boolean =>
    ELECTRON_INTERNAL_OPTION_EXACT.has(token) ||
    ELECTRON_INTERNAL_OPTION_PREFIXES.some((prefix) =>
        token.startsWith(prefix)
    );
