## MODIFIED Requirements

### Requirement: Animated background is lightweight on mobile and respects reduced motion

The animated background SHALL minimize continuous GPU/compositing cost on small-screen and low-power devices. On mobile-width viewports the component SHALL significantly reduce the number of simultaneously animated elements (blurred orbs, floating particles, sparkles, geometric rings, shooting stars) and SHALL reduce or remove expensive blur filters, so that scrolling and interaction remain smooth. The mouse-parallax listener SHALL NOT run on touch/pointer-coarse devices.

The always-rendered base layers SHALL also be cheap on mobile and reduced-motion: the aurora gradient SHALL NOT run its continuous `background-position` animation, the residual blur orbs SHALL be removed or use a lightweight static treatment, and the `mix-blend-mode` noise texture SHALL NOT force per-frame compositing. When the user (or OS) requests reduced motion, the background SHALL disable ALL looping animations (including the aurora base) and render a static gradient with no continuous repaint. Desktop light/dark visual behavior SHALL remain unchanged.

#### Scenario: Mobile viewport reduces animation cost
- **WHEN** the animated background renders on a viewport at or below the mobile breakpoint
- **THEN** it renders a reduced set of animated elements with reduced/removed blur, and does not attach a `mousemove` parallax listener

#### Scenario: Aurora base does not animate continuously on mobile
- **WHEN** the background renders on a mobile viewport or under `prefers-reduced-motion: reduce`
- **THEN** the aurora gradient base is rendered statically (no looping `background-position` animation) and no residual blur/blend layer causes continuous repaint

#### Scenario: Reduced motion preference honored
- **WHEN** the environment reports `prefers-reduced-motion: reduce`
- **THEN** the background disables looping animations (including the aurora base) and shows a static gradient with no continuous repaint

#### Scenario: Desktop appearance preserved
- **WHEN** the app runs on a desktop viewport without a reduced-motion preference
- **THEN** the background appears as before in both light and dark mode
