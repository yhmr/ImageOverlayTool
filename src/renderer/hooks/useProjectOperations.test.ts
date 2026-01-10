// @vitest-environment happy-dom
import { expect, test, describe, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useProjectOperations } from './useProjectOperations';
import { ProjectFile } from '../../shared/types/ProjectFile';

// Mock react-redux
const mockDispatch = vi.fn();
vi.mock('react-redux', () => ({
    useDispatch: () => mockDispatch,
    useSelector: (selector: any) => selector({
        project: {
            unit_factor: 1,
            windowColor: '#000000',
            canvas: { x: 0, y: 0, scale: 1 }
        },
        imageSets: {
            imageSets: []
        }
    }),
}));

// Mock electronAPI
const mockElectronAPI = {
    loadProject: vi.fn(),
    saveProjectAs: vi.fn(),
    saveProject: vi.fn(),
    saveWindowColor: vi.fn(),
    setWindowRect: vi.fn(),
};

// Global window mock
Object.defineProperty(global.window, 'electronAPI', {
    value: mockElectronAPI,
    writable: true
});
Object.defineProperty(global.window, 'outerWidth', { value: 1000, writable: true });
Object.defineProperty(global.window, 'outerHeight', { value: 800, writable: true });
Object.defineProperty(global.window, 'screenX', { value: 100, writable: true });
Object.defineProperty(global.window, 'screenY', { value: 100, writable: true });

describe('useProjectOperations', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('handleNewProject should dispatch reset actions', () => {
        const { result } = renderHook(() => useProjectOperations());

        act(() => {
            result.current.handleNewProject();
        });

        expect(mockDispatch).toHaveBeenCalledTimes(2);
        // We can't easily check the action implementation equality without deeper mocks, 
        // but we can check if it called dispatch.
    });

    test('handleOpenProject should dispatch restore actions when loaded', async () => {
        const mockProject: ProjectFile = {
            version: '1.0.0',
            window: { width: 800, height: 600, x: 0, y: 0, color: '#FFFFFF' },
            settings: { unit_factor: 2 },
            canvas: { x: 10, y: 10, scale: 2 },
            images: []
        };
        mockElectronAPI.loadProject.mockResolvedValue({
            project: mockProject,
            filePath: '/test/path.json'
        });

        const { result } = renderHook(() => useProjectOperations());

        await act(async () => {
            await result.current.handleOpenProject();
        });

        expect(mockDispatch).toHaveBeenCalled();
        expect(mockElectronAPI.saveWindowColor).toHaveBeenCalledWith('#FFFFFF');
        expect(mockElectronAPI.setWindowRect).toHaveBeenCalled();
    });

    test('handleSaveProjectAs should call saveProjectAs API', async () => {
        const { result } = renderHook(() => useProjectOperations());

        mockElectronAPI.saveProjectAs.mockResolvedValue('/new/path.json');

        await act(async () => {
            await result.current.handleSaveProjectAs();
        });

        expect(mockElectronAPI.saveProjectAs).toHaveBeenCalled();
    });
});
