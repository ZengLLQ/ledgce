# Ledgce Interaction Specification

## 1. Interaction Guidelines

All user interactions within Ledgce follow the Starlink-inspired principles of precision, restraint, and immediate operational feedback.

### Key Rules:
- **Hover & Focus**: Transitions must be short and crisp (120ms–180ms).
- **Buttons**: Provide immediate visual depression (`active:scale-[0.98]`) and spinner indication on mutation.
- **Modals & Dialogs**: Fade in with subtle upward translation (`y: 8px -> 0px`, 200ms ease-out). Background dimming is monochromatic (`rgba(0, 0, 0, 0.8)`).
- **Data Tables**: Row hover activates `--color-surface-hover` (`#1B1B1B`). Action buttons inside rows remain accessible via keyboard tab sequence.
- **Toasts**: Non-intrusive notifications anchored to bottom-right, auto-dismissing after 4 seconds with manual close trigger.
- **Copy Actions**: Monospaced identifiers (UUIDs, transaction references) feature 1-click copy with tooltip feedback.
- **Keyboard Navigation**: `Escape` closes modals and drawers; `Enter` submits focused forms; `Tab` traverses all interactive controls.
