# Spec: Animated Background

## Purpose

Defines requirements for the animated background component used across the application, including orbs, particles, sparkles, geometric rings, and shooting stars in both light and dark mode.

## Requirements

### Requirement: Light mode animation visibility
Animated background elements (orbs, particles, sparkles, geometric rings, shooting stars) SHALL be clearly visible in light mode by using sufficiently dark and saturated colors against the light cream/white background. Light mode orb opacity SHALL be at least `0.40` and orb background colors SHALL use mid-to-dark saturation variants (e.g. `bg-blue-500`, `bg-orange-500`, `bg-indigo-500`) rather than near-white or transparent equivalents. Dark mode behavior SHALL remain unchanged.

#### Scenario: Orbs visible in light mode
- **WHEN** the app is in light mode
- **THEN** all animated orbs SHALL be visible to the naked eye against the cream background, with opacity values that make them perceptible without strain

#### Scenario: Dark mode unchanged
- **WHEN** the app is in dark mode
- **THEN** animated elements SHALL display exactly as before, with no change in color or opacity
