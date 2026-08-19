# Straight-Line Diagram (SLD): Carriageway Gauge & Chainage Bar Alignment Specification

**Module**: Straight-Line Diagram (SLD) (`/highways/[id]/sld`)  
**Component**: [`src/components/highways/StraightLineDiagram.tsx`](file:///home/mathir14/nh_proj/src/components/highways/StraightLineDiagram.tsx)  
**Date**: August 14, 2026  
**Status**: Completed & Deployed to `main`  

---

## 1. Overview & Visual UX Objective

In the Straight-Line Diagram (SLD) matrix board, the interface consists of:
1. **Left Fixed Sidebar**: A locked caliper docking guide (**Carriageway Gauge**) with color-coded, height-matched caliper brackets representing standardized road lane widths (6L, 4L, 2L+PS, 2L).
2. **Right Scrollable Canvas (Track 3 - Road Corridor)**: A horizontally scrollable centerline-aligned timeline rendering chainage stretch bars across the highway.

### The Visual Alignment Feature
To provide visual continuity, the top and bottom horizontal borders (`border-y-2`) of each chainage stretch bar in Track 3 are dynamically assigned the **exact border color and pixel height** of its corresponding caliper arm from the left sidebar legend.

When users scroll the diagram horizontally, the top and bottom horizontal border lines of each stretch bar align with the left caliper bracket arms, giving the visual appearance that the scrolling road stretches emerge continuously from the fixed caliper gauge.

---

## 2. Specification & Color Mapping Matrix

| Lane Configuration | Standard Width | Bar Height (`heightPx`) | Center Offset ($\pm H/2$) | Border Color Class | Caliper Left Offset | Caliper Arrowhead |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **6-Lane (`6L`)** | 20m | **150px** | $\pm 75\text{px}$ | `border-y-purple-400` / `border-purple-400` | `12px` | `text-purple-400` |
| **4-Lane / 4L+PS (`4L`)** | 14m | **110px** | $\pm 55\text{px}$ | `border-y-blue-400` / `border-blue-400` | `50px` | `text-blue-400` |
| **2-Lane + Paved Shoulder (`2L+PS`)** | 10m | **76px** | $\pm 38\text{px}$ | `border-y-emerald-400` / `border-emerald-400` | `115px` | `text-emerald-400` |
| **2-Lane (`2L`)** | 7m | **40px** | $\pm 20\text{px}$ | `border-y-amber-400` / `border-amber-400` | `165px` | `text-amber-400` |
| **< 2-Lane** | < 7m | **22px** | $\pm 11\text{px}$ | `border-y-slate-400` / `border-slate-400` | — | — |

---

## 3. Subpixel Precision & Box Model Fixes

During implementation, two subpixel rendering challenges were diagnosed and resolved:

### A. Subpixel Division Rounding on `2L+PS` (Odd vs Even Height)
- **Issue**: `2L+PS` previously had an odd height of `75px`. When centered via `top-1/2 -translate-y-1/2`, $75 / 2 = 37.5\text{px}$. Because $37.5\text{px}$ is a non-integer, browser rendering engines rounded the top and bottom offsets differently ($37\text{px}$ vs $38\text{px}$), resulting in a $0.5\text{px}$ visual misalignment between the scrollable stretch bar and the left caliper arm.
- **Fix**: Adjusted `2L+PS` height to `76px` ($76 / 2 = 38\text{px}$ exact integer). All lane configurations now use strictly even pixel heights ($150\text{px}$, $110\text{px}$, $76\text{px}$, $40\text{px}$, $22\text{px}$), eliminating subpixel fractional shifts.

### B. Caliper Horizontal Arm Container Box-Sizing
- **Issue**: Caliper horizontal arm containers contained an internal right-pointing arrow element (`w-1.5 h-1.5 rotate-45`). In flex containers, child dimensions can expand container height, pushing border lines off the intended vertical coordinates.
- **Fix**: Enforced `h-0 overflow-visible` on both top and bottom caliper horizontal arm containers:
  - Top Arm: `top: calc(50% - ${spec.heightPx / 2}px)` with `border-t-2`
  - Bottom Arm: `top: calc(50% + ${spec.heightPx / 2}px - 2px)` with `border-t-2`
  This guarantees that top and bottom 2px border strokes occupy identical vertical coordinates on both the fixed sidebar and the scrollable canvas.

### C. Cross-Device Horizontal Scrollbar Height Absorption (Windows/Linux vs macOS)
- **Issue**: On devices with physical/classic horizontal scrollbars (Windows, Linux, non-retina displays, external mouse on macOS), the scrollbar consumed 15px–17px of vertical height inside the right scrollable canvas. Because Row 3 / Track 3 used `flex-1`, Track 3 absorbed the entire 17px height loss, shifting its `top-1/2` centerline ~8.5px upwards relative to the left sidebar.
- **Fix**: Locked both the Left Sidebar Gauge (Row 3) and the Right Canvas Road Corridor (Track 3) to an explicit, matched pixel height (`h-[220px] shrink-0`), and removed asymmetric `py-2` padding. Both centerline axes are now mathematically locked at $Y = 110\text{px}$ from container top on all operating systems and viewports.

---

## 4. Implementation Code Reference

### Stretch Bar Styling Logic (`getLaneStyle`)
```tsx
const getLaneStyle = (laneConfig: string) => {
  const norm = (laneConfig || '').toLowerCase();
  const neutralStyle = {
    bg: 'bg-slate-700/80 hover:bg-slate-600/90 text-slate-200',
  };

  if (norm.includes('6l') || norm.includes('6-lane')) {
    return {
      ...neutralStyle,
      border: 'border-y-2 border-y-purple-400',
      label: '6-Lane (6L)',
      heightPx: 150,
    };
  }
  if (norm.includes('4l') || norm.includes('4-lane')) {
    return {
      ...neutralStyle,
      border: 'border-y-2 border-y-blue-400',
      label: '4-Lane / 4L+PS',
      heightPx: 110,
    };
  }
  if (norm.includes('2l+ps') || norm.includes('paved')) {
    return {
      ...neutralStyle,
      border: 'border-y-2 border-y-emerald-400',
      label: '2L + Paved Shoulder',
      heightPx: 76,
    };
  }
  if (norm.includes('2l') || norm.includes('2-lane')) {
    return {
      ...neutralStyle,
      border: 'border-y-2 border-y-amber-400',
      label: '2-Lane (2L)',
      heightPx: 40,
    };
  }
  return {
    ...neutralStyle,
    border: 'border-y-2 border-y-slate-400',
    label: '< 2-Lane',
    heightPx: 22,
  };
};
```

---

## 5. Deployment & Commit History

| Commit SHA | Description |
| :--- | :--- |
| **`1dc122f`** | `feat(sld): match chainage bar top and bottom border colors with carriageway gauge legend` |
| **`58aae45`** | `fix(sld): adjust 2L+PS to even pixel height (76px) and fix caliper line zero-height container alignment` |

**Verification**: Passed TypeScript validation and production build (`npm run build`) in Next.js 16 (Turbopack) with 0 errors.
