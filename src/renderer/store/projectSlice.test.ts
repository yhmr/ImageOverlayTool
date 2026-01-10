import { expect, test, describe } from 'vitest';
import { projectSlice, setUnitFactor, setWindowColor, setCanvasState, resetProject } from './projectSlice';

const reducer = projectSlice.reducer;

describe('projectSlice', () => {
    test('should handle initial state', () => {
        const state = reducer(undefined, { type: 'unknown' });
        expect(state.unit_factor).toBe(1);
        expect(state.windowColor).toBe('#00000000');
        expect(state.canvas).toEqual({ x: 0, y: 0, scale: 1 });
    });

    test('should handle setUnitFactor', () => {
        const previousState = reducer(undefined, { type: 'unknown' });
        const state = reducer(previousState, setUnitFactor(2.5));
        expect(state.unit_factor).toBe(2.5);
    });

    test('should handle setWindowColor', () => {
        const previousState = reducer(undefined, { type: 'unknown' });
        const state = reducer(previousState, setWindowColor('#FFFFFF'));
        expect(state.windowColor).toBe('#FFFFFF');
    });

    test('should handle setCanvasState', () => {
        const previousState = reducer(undefined, { type: 'unknown' });
        const newCanvas = { x: 10, y: 20, scale: 1.5 };
        const state = reducer(previousState, setCanvasState(newCanvas));
        expect(state.canvas).toEqual(newCanvas);
    });

    test('should handle resetProject', () => {
        // Setup modified state
        let state = reducer(undefined, setUnitFactor(5));
        state = reducer(state, setCanvasState({ x: 100, y: 100, scale: 2 }));
        state = reducer(state, setWindowColor('#123456'));

        // Reset
        state = reducer(state, resetProject());

        expect(state.unit_factor).toBe(1); // Resets
        expect(state.canvas).toEqual({ x: 0, y: 0, scale: 1 }); // Resets
        expect(state.windowColor).toBe('#123456'); // Does NOT reset
    });
});
