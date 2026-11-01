import { createContext, type RefObject } from 'react';

// Fraction of the canvas resolution the surrounding layer renders at. Effects
// that size their own buffers or points in pixels read it.
export const RenderScaleContext = createContext(1);

// Whether the surrounding layer is on screen this frame. Effects with their
// own expensive passes skip them while their layer is hidden (e.g. a preset
// preloaded for the next transition).
export const LayerVisibleContext = createContext<RefObject<boolean>>({ current: true });
