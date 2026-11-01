# Making the Visualizer Faster: What Changed and Why

This explains every performance change in plain language. You don't need to
know graphics programming to follow it.

## First, a few ideas you need

**Frames and FPS.** The visualizer works like a flip book. It draws a picture
(a *frame*), shows it, and immediately draws the next one. How many it draws per
second is the **frame rate**, measured in **FPS** (frames per second). Most
screens refresh 60 times a second, so 60 FPS looks perfectly smooth. Around 30
looks choppy, and below 20 feels like a slideshow.

**The time budget.** At 60 FPS each frame gets about **16.7 milliseconds**
(thousandths of a second). If any frame takes longer, the animation stutters.
So "making it faster" really means "doing less work per frame."

**The GPU and pixels.** Your computer has a graphics chip (the **GPU**) that
calculates the color of every pixel, every frame. Each effect is a small program
called a **shader** that runs once *per pixel*. A 1080p screen has about 2
million pixels, so at 60 FPS that's 120 million shader runs per second. Some of
our shaders loop hundreds of times per pixel, which is where the slowness comes
from.

The big lesson: **cost = (work per pixel) × (number of pixels) × (frames per
second).** Almost every change below shrinks one of those three numbers.

---

## 1. A performance meter you can see (the FPS overlay)

**What it is:** A small box in the top-right corner of the visuals showing:

- the **FPS** number, colored green (smooth), yellow (okay) or red (slow)
- a mini bar graph of the last 30 seconds of FPS
- the average and the *worst* frame time in milliseconds
- the resolution being drawn, like `1920×1080 @ 2.00×`, and, for heavy
  effects, the reduced size they're drawn at (for example `effect 70%`)
- how many shader programs are loaded on the GPU

**Why:** You can't improve what you can't measure. Now you can switch effects
or settings and instantly see whether things got faster.

**How to use it:** Click **📊** at the top of the left panel, or turn it on in
**⚙️ Settings → Performance**.

## 2. Turned off "anti-aliasing" we didn't need (biggest free win)

**What was happening:** *Anti-aliasing* smooths jagged, stair-stepped edges on
3D objects. One way to do it (called **MSAA**) draws each pixel several times
at slightly different spots and averages them. Our glow (Bloom) step was set to
draw everything **8 times per pixel**, and the canvas had its own anti-aliasing
switched on too.

**Why that was wasteful:** Our effects aren't 3D objects with edges. Each one
is a single flat rectangle covering the whole screen, with the picture
calculated inside it. There were no jagged edges to smooth, so all that extra
drawing changed nothing you could see.

**What we did:** Turned both off. The picture looks the same and the GPU does
far less work.

*Analogy:* like photocopying every page of a book 8 times just to be sure,
then only ever reading one copy.

## 3. Fixed the "giant particles" bug

**What was happening:** The Particles effect showed a solid white screen. Each
particle's size was calculated with a formula meant for a camera with
*perspective* (where far things look smaller). Our camera has no perspective,
so the formula divided by about 1 instead of about 5 and every particle came out
**1,500+ pixels wide**. A thousand screen-sized glowing dots piled on top of
each other made white, and forced the GPU to color billions of pixels per
frame.

**What we did:** Particles are now sized in real screen pixels (about 5–15
each) and the cloud is spread to fit the screen. It now looks like an actual
swirl of particles and is roughly **50× faster** in our tests.

## 4. A Quality setting, with an "Auto" mode

**The idea:** High-resolution ("retina") screens pack in 2× more pixels in each
direction, which is **4× more pixels** in total. That's sharper, but the shader
runs 4 times as often. The *pixel ratio* setting decides how many real pixels
to draw for each on-screen dot.

**What we did:** Added a **Quality** setting in **⚙️ Settings → Performance**:

| Setting | What it does |
|---|---|
| **Auto** (default) | Starts at full sharpness, watches the FPS, and lowers the resolution a step at a time when frames get slow (raising it again when there's room). |
| **High** | Always full sharpness (up to 2×). Best looking, slowest. |
| **Balanced** | Standard sharpness (1×). Much faster on retina screens. |
| **Performance** | Slightly below standard, for older or weaker computers. |

*Analogy:* like a video streaming app dropping from 4K to 1080p when your
internet slows down, so the video keeps playing smoothly.

## 5. Heavy effects draw smaller, then get stretched

**What was happening:** Some effects (Protean Clouds, Star Nest, Warp Speed,
Liquid Carbon, Plasma Globe, The Drive Home, Blue, Main Sequence Star) use
**ray marching**: for every pixel they step forward through a 3D scene up to
100+ times. They're by far the most expensive.

**What we did:** These effects now draw at a smaller internal size (65–85% of
the screen) and are smoothly stretched to fit. Because they're soft, glowing and
cloudy, you can't really tell. Drawing at 70% width and height means only about
**half** the pixels (0.7 × 0.7 ≈ 0.5), so roughly half the work. The **High**
quality setting turns this off.

*Analogy:* painting a mural on a smaller canvas and projecting it onto the
wall. For a blurry sunset nobody notices; for fine text you would, which is why
sharp effects like Truchet and Parametrics are left at full size.

## 6. One canvas instead of two, and hidden things don't draw

**What was happening:** To fade between presets in a sequence, the app used to
stack **two complete drawing surfaces** on top of each other and fade one out.
Both kept drawing every frame, even when one was completely invisible.

**What we did:** Both presets now draw on **one** surface, and a preset that
isn't on screen isn't drawn at all. Only during a transition are both drawn.
(This change also made the fancy transitions possible: sphere, cube, vortex and
the rest.) Effects with an extra expensive stage, like Liquid Carbon, also skip
that stage while hidden.

## 7. Shaders get prepared ahead of time (no stutter when transitions start)

**What was happening:** Before the GPU can run a shader, it must **compile**
it, translating the code into instructions the chip understands. Big shaders
can take anywhere from a fraction of a second to a few seconds. This used to
happen at the exact moment a transition started, so the screen would freeze
right when something exciting should happen.

**What we did:** As soon as one transition finishes, the app quietly loads the
*next* preset in the background and compiles its shaders while the current
preset is still showing. When the next transition starts, everything is ready.

*Analogy:* a stage crew setting up the next scene behind the curtain instead of
in front of the audience.

## 8. Stopped redrawing the whole page every frame

**What was happening:** Besides the GPU, the app's interface code (built with
**React**) also does work. Two things made React rebuild large parts of the
page 60 times a second:

- With the microphone or music on, every audio update made every effect
  component refresh.
- During transitions, the fade progress was stored in a way that rebuilt the
  whole visual area every frame.

**What we did:** These values are now passed straight to the shaders without
asking React to rebuild anything. React only does work when something actually
changes, like a new preset. (The progress bar in fullscreen mode updates itself
directly too.)

*Analogy:* instead of reprinting a whole newspaper to change one number on the
scoreboard, you just flip that one number.

## 9. Bloom (the glow) can be turned off

**What it is:** Bloom adds a soft glow around bright areas. It's an extra
step after the effect is drawn.

**What we did:** Added a **Bloom glow** checkbox in **⚙️ Settings →
Performance**. With step 2 done, Bloom is much cheaper than before, so it's on
by default. Turning it off saves a bit more on slow computers. We also made sure
colors stay the same with it off (the glow step was also the one converting
colors for your screen, so we now do that conversion ourselves when it's off).

## 10. Less "garbage" every frame

**What was happening:** Every frame, effects created brand-new color and size
objects in memory, used them once, and threw them away. The browser has a
**garbage collector** that periodically cleans these up, and when it runs it can
cause tiny hiccups.

**What we did:** Effects now reuse the same objects and just update the numbers
inside them.

*Analogy:* washing and reusing the same cup instead of using a new paper cup for
every sip.

## 11. Removed a leftover 2-second pause in fullscreen

Fullscreen playback paused for 2 seconds after every transition and showed a
"Preset Phase / Transition Phase" label in the corner. That was debugging code
left over from earlier work. It's gone, so sequences now flow continuously.
Pausing and resuming also picks up where it left off instead of restarting the
timer.

## 12. Bonus bug fix: audio now works in fullscreen

The code that listens to the microphone or music used to live inside the
**Audio** panel. Fullscreen mode hides that panel, so audio-reactive presets
froze at whatever the last sound level was. The listening code now runs at the
top level of the app, so it keeps working in every mode.

---

## Did it work? Test results

We measured with the same frame counter before and after, at 2× pixel ratio
(like a retina screen). **Important:** these tests ran in a *software* renderer
(the computer pretending to be a GPU), which is far slower than a real graphics
chip. The absolute numbers are tiny, but the **comparisons** show which changes
matter. On a real GPU everything runs many times faster.

| Effect | Before | After (High quality) | After (Balanced quality) |
|---|---|---|---|
| Particles | 0.07 FPS | 3.5 FPS | — |
| Metaballs | 2.6 FPS | 2.1 FPS | 6.4 FPS |
| Protean Clouds | 0.03 FPS | 0.27 FPS | 1.55 FPS |
| Star Nest | 0.11 FPS | 0.10 FPS | 4.6 FPS |

What this shows:

- **The Particles fix is huge**, about 50× faster.
- **Quality settings matter most.** Balanced is 3–45× faster than High, because
  it cuts the number of pixels.
- **One honest trade-off:** at the exact same settings, a light effect like
  Metaballs got about 20% slower in this test. Each frame is now drawn to an
  in-between image and then copied to the screen. That extra copy is what makes
  the new transitions and per-effect resolution possible. On a real GPU it costs
  a tiny fraction of a millisecond, but the software renderer exaggerates it.
- The heaviest effects run so slowly in software that their exact numbers are
  rough; only a frame or two fit in the test window.

**The real test is on your computer:** turn on the 📊 overlay, pick an effect,
and try the Quality settings to see the FPS change.

## Ideas for later

- Skip the in-between image when only one preset is showing and it's drawn at
  full size, to win back the small cost mentioned above.
- Let each preset choose its own quality, so a slow effect can drop resolution
  without affecting lighter ones.
- Measure GPU time directly (not just FPS) on browsers that support it.
