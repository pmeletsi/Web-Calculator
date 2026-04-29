# Web Calculator Training

**Date:** Sep 16, 2025

**Subject:** Web Calculator implementation as a web application

**Job Title & Level:** Applies to junior level software developers

**Duration:** Its duration of execution is estimated from 1 to 2 months

**Prerequisites:** Always to be applied along with a coach software engineer

---

## Functional Requirements

- **Calculator page** — A web application needs to be implemented that allows users to perform simple arithmetic calculations (+, -, *, /) and shows the result of the calculation on a web page
- **Calculations History page** — In addition to performing calculations, it should be possible to view previous calculations and search by user
- **Login page** — Only authorized users should be able to log on and perform calculations (there is no need to manage users from within the Web Calculator, users can be scripted)
- All calculations should be logged together with a timestamp and a unique username to track the user
- Validation should be in place to prevent users from submitting calculations that will result in an error
- It should be possible for users to log out

## Non-functional Requirements

- The front end to be implemented in React, the back end in Java/Spring Boot or .NET Core and the database in PostgreSQL
- Make sure you follow the Google Style Guides and apply best code quality practices
- Install the SonarQube for IDE and use it while coding locally
- The source code should be managed and versioned in a source code repository, including also the sql scripts. There should be enough branches to support an uninterrupted user acceptance testing phase and frequent releases. Gitflow should be followed
- The project should be managed in a KanBan board and any notes/documentation should be kept in wiki pages. There should be traceability of code commits to user stories for easier system support
- It should be possible to configure the system to run in multiple environments without any code changes
- Code should be well structured and decoupled to allow the creation of unit tests
- An ORM should be used for the interaction with the database

## Advanced Requirements

- There should be Continuous Integration and Continuous Deployment in place to enable easy and efficient releases
- The software should be deployed in Azure PaaS and all costs should be kept to a minimum *[Not Applicable]*

## AI Assisted Code Development

When the web calculator is complete, recreate it in a new Git repository, leveraging GitHub Copilot to the fullest.

---

## Phased Development

### Phase 1 – Analysis, Design and Wireframes

- Wiki
- ER-Diagram
- Wireframes (Login page, New Calculations page, Calculations History page)

### Phase 2 – Core Implementation

- KanBan Board
- Git Repository & Gitflow
- Back-end development
- Front-end development
- Unit tests
- Application is deployed and running locally

### Phase 3 – Advanced Features Implementation

- CI/CD (compile, build, package, unit tests)
- Application running in Azure PaaS *[Not Applicable]*

### Phase 4 – Re-implement the solution with AI Tools

- GitHub Copilot
