## ADDED Requirements

### Requirement: Production domain serves valid HTTPS on apex and www

The production deployment SHALL serve the site over valid HTTPS on both the apex domain `hmti.my.id` and the `www.hmti.my.id` subdomain. DNS SHALL resolve both names to the production VPS, Nginx SHALL define server blocks for both names, and a valid (non-expired, correctly-chained) TLS certificate SHALL be installed and auto-renewing. Plain HTTP requests SHALL redirect to HTTPS.

#### Scenario: HTTPS loads on apex and www
- **WHEN** a user opens `https://hmti.my.id` or `https://www.hmti.my.id`
- **THEN** the site loads with a valid, trusted TLS certificate and no browser security warning

#### Scenario: HTTP redirects to HTTPS
- **WHEN** a user requests the site over plain `http://`
- **THEN** the server responds with a redirect to the `https://` equivalent

### Requirement: Production site is reachable from mobile browsers

The production domain SHALL be reachable and load correctly on common mobile browsers. DNS records (including `www`) SHALL be fully propagated, and the TLS certificate SHALL present a complete certificate chain so mobile browsers that do not cache intermediate certificates still validate the connection.

#### Scenario: Mobile browser loads the site
- **WHEN** a user opens `hmti.my.id` (with or without `www`) on a mobile browser
- **THEN** the domain resolves, TLS validates via a complete chain, and the site loads without a "cannot be reached" or certificate error
