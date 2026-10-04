# Quách Gia Vinh — Software Engineering Portfolio

Live site: **https://vinh17491.github.io/web1/**

This repository is a static, recruiter-facing engineering portfolio for `@vinh17491`.

## Design goal

The site is deliberately structured as an **engineering dossier**, not a gallery of technology logos. It gives different reviewers different depths:

- Recruiter / HR: identity, experience, skills and selected work on the homepage.
- Engineer / tech lead: project case studies with architecture, trade-offs, verification and limitations.
- Hiring process: a printable HTML resume with direct links back to source.

## Case studies

- **GymFit** — role-based full-stack platform with auth/RBAC hardening, inventory reservation, commerce state and acceptance evidence.
- **Flight Booking System** — React + ASP.NET Core application with JWT, EF Core/SQLite and separated checkout/payment services.
- **Minecraft AutoCraft** — Java/Meteor automation built around an explicit acknowledgement-bound state machine.

Every quantitative claim shown on the site is sourced from repository code or project documentation. The portfolio intentionally avoids invented production traffic, user counts or performance metrics.

## Structure

```text
index.html                    Recruiter-facing overview
resume.html                   Printable resume
projects/gymfit.html          Deep technical case study
projects/flight-booking.html  Deep technical case study
projects/autocraft.html       Deep technical case study
styles.css                    Shared responsive design system
script.js                     Accessible navigation + progressive reveal
robots.txt / sitemap.xml      Search indexing
.github/workflows/pages.yml   GitHub Pages deployment
```

## Quality choices

- No framework runtime or build step for the portfolio itself.
- Semantic HTML and keyboard-visible focus states.
- Reduced-motion support.
- Responsive layout for mobile, tablet and desktop.
- Static hosting through GitHub Pages.
- SEO metadata, canonical URLs, sitemap and Person/ProfilePage structured data.

## Local preview

```bash
python -m http.server 8000
```

Open `http://localhost:8000`.
