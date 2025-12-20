# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A standalone React component for scoring and comparing used electric vehicle listings using Multi-Criteria Decision Analysis (MCDA). Two versions exist:

- `car-value-scorer.jsx` - Primary version with full UI, vehicle database autocomplete, multi-step add form, starred favorites, and notes
- `car-value-scorer-alt-version.jsx` - Alternate table-based layout with detailed score breakdown view

## Architecture

### Scoring Algorithm

The MCDA algorithm normalizes each vehicle attribute to a 0-1 scale, applies user-configurable weights, and sums for a final 0-100 score. Key criteria:

| Criteria | Direction | Notes |
|----------|-----------|-------|
| Price, Odometer, Distance, Length, Damage | Lower is better | Inverted during normalization |
| Range, Year, Trim Level | Higher is better | Direct normalization |
| Heat Pump | Binary | Yes = 1, No = 0 |
| Remote Start | Categorical | Fob+App = 1 (best), other = 0 |

### Data Storage

Uses `window.storage` API (with localStorage fallback) for persistence:
- Storage key: `evscorer_data` (primary) or `car-scorer-data` (alt)
- Auto-saves with 2-second debounce
- Falls back to `SAMPLE_CARS` on first run or load failure

### Vehicle Database

`VEHICLE_DATABASE` contains EV specs (range, length, heat pump) by make/model with trim options. Used for autocomplete in the add form.

### Location System

`LOCATION_PRESETS` maps location names to distance ratings (1-10 scale, 1 = local). Ontario-centric defaults centered around London.

## Running the App

These are standalone React components intended to be rendered in a React environment. They use:
- React hooks (useState, useMemo, useEffect, useRef)
- lucide-react for icons
- Inline CSS via template literals (no external stylesheets)
- Google Fonts: Space Grotesk, JetBrains Mono

## Port Management

See `~/.claude/PORTS.md` for port allocation. This project should use an available frontend port from range 3001-3019.
