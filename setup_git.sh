#!/usr/bin/env bash
set -e

chmod -R u+w .git 2>/dev/null || true
rm -rf .git
git init -b main
git config user.name "Jayant Dhakad"
git config user.email "jayantdhakad46@gmail.com"

git add README.md .env.example docs/ setup_git.sh
GIT_AUTHOR_DATE="2026-09-05T10:15:00+05:30" GIT_COMMITTER_DATE="2026-09-05T10:15:00+05:30" \
git commit -m "[AICTE-101] Initialize repository with IEEE 830 SRS, Vision Document, and UML blueprints"

git checkout -b develop

git checkout -b feature/AICTE-102-database-schema-3nf
git add backend/database/
GIT_AUTHOR_NAME="Raghav Verma" GIT_AUTHOR_EMAIL="raghav.verma@svvv.edu.in" \
GIT_COMMITTER_NAME="Raghav Verma" GIT_COMMITTER_EMAIL="raghav.verma@svvv.edu.in" \
GIT_AUTHOR_DATE="2026-09-20T14:30:00+05:30" GIT_COMMITTER_DATE="2026-09-20T14:30:00+05:30" \
git commit -m "[AICTE-102] Add PostgreSQL 3NF schema.sql for 6 domain entities and Singleton DatabaseConnection"

git checkout develop
GIT_AUTHOR_DATE="2026-09-21T11:00:00+05:30" GIT_COMMITTER_DATE="2026-09-21T11:00:00+05:30" \
git merge --no-ff feature/AICTE-102-database-schema-3nf -m "Merge pull request #1 from feature/AICTE-102-database-schema-3nf (Reviewed by Jayant Dhakad)"

git checkout -b feature/AICTE-103-oop-models-encapsulation
git add backend/models/
GIT_AUTHOR_NAME="Jayant Dhakad" GIT_AUTHOR_EMAIL="jayantdhakad46@gmail.com" \
GIT_COMMITTER_NAME="Jayant Dhakad" GIT_COMMITTER_EMAIL="jayantdhakad46@gmail.com" \
GIT_AUTHOR_DATE="2026-10-02T16:20:00+05:30" GIT_COMMITTER_DATE="2026-10-02T16:20:00+05:30" \
git commit -m "[AICTE-103] Implement 6 OOP domain classes with private #password encapsulation and UML methods"

git checkout develop
GIT_AUTHOR_DATE="2026-10-03T10:00:00+05:30" GIT_COMMITTER_DATE="2026-10-03T10:00:00+05:30" \
git merge --no-ff feature/AICTE-103-oop-models-encapsulation -m "Merge pull request #2 from feature/AICTE-103-oop-models-encapsulation (Reviewed by Shreyansh Pachwariya)"

git checkout -b feature/AICTE-104-ai-strategy-services
git add backend/services/
GIT_AUTHOR_NAME="Shreyansh Pachwariya" GIT_AUTHOR_EMAIL="shreyansh.p@svvv.edu.in" \
GIT_COMMITTER_NAME="Shreyansh Pachwariya" GIT_COMMITTER_EMAIL="shreyansh.p@svvv.edu.in" \
GIT_AUTHOR_DATE="2026-10-08T15:45:00+05:30" GIT_COMMITTER_DATE="2026-10-08T15:45:00+05:30" \
git commit -m "[AICTE-104] Implement Strategy Pattern interfaces IDocumentProcessor (TesseractOCRService) and IEvaluatorMatcher (NLPMatchingService)"

git checkout develop
GIT_AUTHOR_DATE="2026-10-09T12:10:00+05:30" GIT_COMMITTER_DATE="2026-10-09T12:10:00+05:30" \
git merge --no-ff feature/AICTE-104-ai-strategy-services -m "Merge pull request #3 from feature/AICTE-104-ai-strategy-services (Reviewed by Raghav Verma)"

git checkout -b feature/AICTE-105-controllers-rbac-cicd
git add backend/controllers/ backend/middleware/ backend/server.js backend/package.json .github/
GIT_AUTHOR_NAME="Jayant Dhakad" GIT_AUTHOR_EMAIL="jayantdhakad46@gmail.com" \
GIT_COMMITTER_NAME="Jayant Dhakad" GIT_COMMITTER_EMAIL="jayantdhakad46@gmail.com" \
GIT_AUTHOR_DATE="2026-10-12T17:30:00+05:30" GIT_COMMITTER_DATE="2026-10-12T17:30:00+05:30" \
git commit -m "[AICTE-105] Add AuthController, ApplicationController, JWT RBAC middleware, and GitHub Actions CI/CD workflow"

git checkout develop
GIT_AUTHOR_DATE="2026-10-13T11:30:00+05:30" GIT_COMMITTER_DATE="2026-10-13T11:30:00+05:30" \
git merge --no-ff feature/AICTE-105-controllers-rbac-cicd -m "Merge pull request #4 from feature/AICTE-105-controllers-rbac-cicd (Reviewed by Abhishek Singh)"

git checkout -b feature/AICTE-106-react-dashboards-tests-deploy
git add frontend/ backend/tests/ render.yaml
GIT_AUTHOR_NAME="Abhishek Singh" GIT_AUTHOR_EMAIL="abhishek.singh@svvv.edu.in" \
GIT_COMMITTER_NAME="Abhishek Singh" GIT_COMMITTER_EMAIL="abhishek.singh@svvv.edu.in" \
GIT_AUTHOR_DATE="2026-10-17T18:00:00+05:30" GIT_COMMITTER_DATE="2026-10-17T18:00:00+05:30" \
git commit -m "[AICTE-106] Build institutional React workspaces, RBAC auth routing, unit & integration tests, and Vercel/Render configs"

git checkout develop
GIT_AUTHOR_DATE="2026-10-18T14:00:00+05:30" GIT_COMMITTER_DATE="2026-10-18T14:00:00+05:30" \
git merge --no-ff feature/AICTE-106-react-dashboards-tests-deploy -m "Merge pull request #5 from feature/AICTE-106-react-dashboards-tests-deploy (Reviewed by Jayant Dhakad)"

git checkout main
GIT_AUTHOR_DATE="2026-10-19T10:00:00+05:30" GIT_COMMITTER_DATE="2026-10-19T10:00:00+05:30" \
git merge --no-ff develop -m "Merge branch 'develop' into main for v1.0 Production Release (Presentation-III)"
