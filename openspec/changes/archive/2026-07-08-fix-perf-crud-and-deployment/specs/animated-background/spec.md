## ADDED Requirements

### Requirement: Animated background is lightweight on mobile and respects reduced motion

The animated background SHALL minimize continuous GPU/compositing cost on small-screen and low-power devices. On mobile-width viewports the component SHALL significantly reduce the number of simultaneously animated elements (blurred orbs, floating particles, sparkles, geometric rings, shooting stars) and SHALL reduce or remove expensive blur filters, so that scrolling and interaction remain smooth. The mouse-parallax listener SHALL NOT run on touch/pointer-coarse devices. When the user (or OS) requests reduced motion, the background SHALL disable looping animations and render a static gradient. Desktop light/dark visual behavior SHALL remain unchanged.

#### Scenario: Mobile viewport reduces animation cost
- **WHEN** the animated background renders on a viewport at or below the mobile breakpoint
- **THEN** it renders a reduced set of animated elements with reduced/removed blur, and does not attach a `mousemove` parallax listener

#### Scenario: Reduced motion preference honored
- **WHEN** the environment reports `prefers-reduced-motion: reduce`
- **THEN** the background disables looping animations and shows a static gradient with no continuous repaint

#### Scenario: Desktop appearance preserved
- **WHEN** the app runs on a desktop viewport without a reduced-motion preference
- **THEN** the background appears as before in both light and dark mode
