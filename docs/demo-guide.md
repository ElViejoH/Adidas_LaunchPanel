# Six-Minute Demo Guide

This guide provides a focused walkthrough of the main capabilities of Adidas Launch Panel. The complete desktop and mobile inspection is documented in the [final visual QA report](qa-visual.md).

The complete narration and recording cues are available in the [six-minute presentation script](presentation-script.md).

## Demo objective

By the end of the demonstration, the audience should understand how the platform turns a fragmented product-launch process into a role-based, auditable workflow supported by a clear user experience and a simple full-stack architecture.

## Preparation

1. Start the API at `http://localhost:4000`.
2. Start the frontend at `http://localhost:5173`.
3. Select `EN` in the language switcher.
4. Use the local accounts below with the password `password123`.

| Role | Email |
| --- | --- |
| Creator | `creator@adidas.com` |
| Approver | `approver@adidas.com` |
| Administrator | `admin@adidas.com` |

The seed database includes launches across different statuses, markets, and dates.

## Recommended timing

| Time | Segment | Purpose |
| --- | --- | --- |
| `0:00–0:25` | Problem and users | Introduce the coordination and traceability problem |
| `0:25–0:50` | Solution | Present the shared launch workspace and its three roles |
| `0:50–4:10` | Live product walkthrough | Demonstrate the complete critical workflow |
| `4:10–4:50` | Design and UX | Explain hierarchy, role cues, status treatment, and bilingual support |
| `4:50–5:30` | Technical architecture | Summarize React, Express, Prisma, SQLite, and authorization |
| `5:30–5:50` | Challenges and lessons | Cover workflow consistency, draft privacy, and automated QA |
| `5:50–6:00` | Closing | Reinforce the result and acknowledge the local prototype scope |

## Product walkthrough

1. **Login and language.** Show the campaign image, select a demo account, and confirm that `EN` is active in the upper-right language switcher.
2. **Creator overview.** Explain the metrics, upcoming launches, and available tasks. Sign in as the creator and select **Create launch**.
3. **Launch and asset creation.** Complete the name, description, market, and launch date. Save the draft, add an asset URL, and select **Submit for review**.
4. **Filters and calendar.** Open **Launches**, combine search, market, status, and date filters, and then locate the launch in **Launch calendar**.
5. **Approval workflow.** Sign out, enter as the approver, and open the submitted launch. Demonstrate **Request changes** or **Approve launch**. If approved, finish with **Publish launch**.
6. **Traceability.** Point out the status history, the actor responsible for each transition, its timestamp, and any associated comment.
7. **Administration.** Enter as the administrator, open **Users and permissions**, and change the role of an account other than the current administrator. Explain that the API independently validates the action.
8. **Responsive behavior.** Reduce the viewport width to show the mobile navigation and confirm that the language switcher remains available.

## Reference screenshots

| View | Evidence |
| --- | --- |
| Login | [01-login.png](screenshots/01-login.png) |
| Creator overview | [02-creator-overview.png](screenshots/02-creator-overview.png) |
| Launch list and filters | [03-launch-list.png](screenshots/03-launch-list.png) |
| Launch calendar | [04-launch-calendar.png](screenshots/04-launch-calendar.png) |
| Launch details | [05-launch-details.png](screenshots/05-launch-details.png) |
| Users and permissions | [06-users-permissions.png](screenshots/06-users-permissions.png) |
| Mobile administrator overview | [07-mobile-admin-overview.png](screenshots/07-mobile-admin-overview.png) |

## Regenerating the screenshots

The screenshot flow uses the isolated E2E database and never modifies `backend/prisma/dev.db`.

From PowerShell:

```powershell
cd frontend
$env:CAPTURE_DEMO = '1'
npx playwright test e2e/demo-capture.spec.js
Remove-Item Env:CAPTURE_DEMO
```

The process recreates the reference screenshots with the English interface at a desktop viewport of 1440 × 900 and a mobile viewport of 390 × 844.
