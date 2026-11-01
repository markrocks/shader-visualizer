# Performance Recommendations

The visualizer is likely GPU-bound while rendering, especially at high display
resolutions or on integrated graphics. The recommendations below are based on
the current render and playback implementation; profile before and after each
change to confirm its impact.

## Highest-impact opportunities

1. **Reduce rendering resolution.** `VisualizationCanvas` configures React
   Three Fiber with `dpr={[1, 2]}`. A device pixel ratio of 2 shades roughly
   four times as many pixels as a ratio of 1. Consider capping the DPR at 1.5
   or 1, or exposing a quality setting.
2. **Make Bloom optional or cheaper.** The `EffectComposer` and `Bloom` pass in
   `VisualizationCanvas` add GPU work to every rendered frame. Compare
   performance with Bloom disabled and consider a quality toggle or less
   expensive settings.
3. **Avoid rendering two full canvases except during a crossfade.** Sequence
   playback in `PreviewCanvas` mounts two `VisualizationCanvas` instances.
   Both run their shaders and post-processing while mounted, including when
   one layer is hidden. Render only the active layer outside the transition,
   or otherwise pause rendering on the inactive layer.
4. **Review the most expensive shaders.** Shader cost is multiplied by the
   number of pixels rendered. For example, `clouds.ts` has a 130-iteration
   loop, and `warpSpeed.ts` has nested loops. Profile these effects on target
   hardware and reduce iteration counts or use a lower render resolution when
   needed.

## Additional improvements

- **Reduce per-frame allocations.** Several effects create new `THREE.Color`
  instances inside `useFrame`, for example `MetaballsEffect`. Update existing
  color uniform values instead of allocating new colors every frame.
- **Remove the fullscreen playback debug pause.** `FullscreenPlayer` pauses
  for two seconds after each transition. This is separate from rendering
  performance, but makes sequence playback feel slow. Remove it for normal
  playback, or retain it only behind an explicit debug option.
- **Measure before and after changes.** Compare frame rate and GPU usage for
  the same effect, canvas size, and Bloom setting. Test both a single preview
  and a sequence crossfade, and include lower-powered hardware when possible.

## Suggested order

Start by testing a lower DPR and disabling Bloom, since both affect all
shader-rendered pixels. Next address the double-canvas crossfade and expensive
shader loops. Tackle per-frame allocations afterward. Treat the fullscreen
pause as a playback behavior issue rather than a rendering optimization.
