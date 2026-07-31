# Final Visual QA Report

## Result

The visual review is approved for the local challenge scope. The main views were inspected at a desktop viewport of 1440 × 900, and the administrator overview was inspected at a mobile viewport of 390 × 844.

| View | Checks | Result |
| --- | --- | --- |
| Login | Full-height campaign image, legible logo, form, roles, and language switcher | Passed |
| Creator overview | Hierarchy, metrics, cards, actions, and sidebar | Passed |
| Launch list | Filters, table, status badges, actions, and result count | Passed |
| Launch calendar | Monthly navigation, filters, grid, events, and current date | Passed |
| Launch details | Actions, primary information, assets, workflow, and history | Passed |
| Users and permissions | Role colors, filters, table, and security notice | Passed |
| Mobile administrator overview | Navigation, language switcher, primary action, metrics, cards, and permissions panel | Passed |

## Cross-view criteria

- No horizontal overflow was detected in the desktop or mobile screenshots.
- Images loaded without broken references.
- Fonts finished loading before each screenshot.
- Operational headings, calls to action, and labels remained legible; the oversized login campaign headline intentionally extends to the panel edge.
- The `ES / EN` switcher remained visible in the upper-right corner.
- Role styling followed the requested system: gold administrator, black approver, and white creator.
- Interactive controls retained visible hover, focus, and contrast states.
- Statuses used text labels and outlined color cues instead of relying on fully colored containers.

## Adjustments completed during QA

1. Removed a duplicated result total in the launch list.
2. Corrected Spanish long-date capitalization so that prepositions remain lowercase.
3. Reduced the administrator access-control card to match its content.
4. Increased the internal interface scale to make better use of wide desktop screens.
5. Strengthened the hover treatment of black buttons by inverting their foreground and background colors.

The final screenshots and recommended walkthrough are available in the [demo guide](demo-guide.md).
