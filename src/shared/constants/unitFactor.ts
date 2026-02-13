export const UNIT_FACTOR_DEFAULT = 1.0;
export const UNIT_FACTOR_MIN = 0.0001;
export const UNIT_FACTOR_MAX = 1000000;

export const sanitizeUnitFactor = (value: unknown): number => {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        return UNIT_FACTOR_DEFAULT;
    }

    if (value < UNIT_FACTOR_MIN) {
        return UNIT_FACTOR_MIN;
    }

    if (value > UNIT_FACTOR_MAX) {
        return UNIT_FACTOR_MAX;
    }

    return value;
};
