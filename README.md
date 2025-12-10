# BudgetCents

A modern fraternity budget management and member directory platform. BudgetCents streamlines budget tracking, member management, committee oversight, and payment processing for Greek organizations.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Environment Setup (.env.local)](#environment-setup-envlocal)
- [Installation](#installation)
- [Running Locally](#running-locally)
- [Project Structure](#project-structure)
- [API Routes](#api-routes)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

---

## Overview

BudgetCents is a full-stack web application designed to help fraternities and sororities manage their finances, membership, and committee activities. The platform integrates with Google Sheets for dynamic budget data, Auth0 for secure authentication, and Stripe for payment processing.

### Key Capabilities

- **Budget Management**: Real-time expense tracking and budget visualization from Google Sheets
- **Membership Tracking**: Detailed member profiles, status management, and membership structure visualization
- **Committee Oversight**: Budget allocation and activity tracking by committee
- **Payment Processing**: Stripe integration for member dues collection and payment webhooks
- **Admin Dashboard**: Comprehensive dashboard with charts, pending budget requests, and service carousel

---

## Features

✅ **Google Sheets Integration** – Read budget and membership data directly from Google Sheets  
✅ **Dynamic Charts** – Doughnut/pie charts showing expense breakdown and membership structure  
✅ **Role-Based Access Control** – Admin-only dashboard with Auth0 role verification  
✅ **Budget Requests** – Members submit budget requests; admins accept/decline  
✅ **Committee Management** – Create committees, allocate budgets, track activities  
✅ **Responsive Design** – Mobile-friendly UI with Mantine component library  
✅ **Real-Time Webhooks** – Stripe webhook handling for payment confirmations  
✅ **Member Profiles** – Individual member pages with profile management  

---

## Tech Stack

### Frontend
- **Next.js 15.0.3** – React framework with API routes and server-side rendering
- **React 18.3.1** – UI library
- **TypeScript** – Type-safe JavaScript
- **Mantine UI 7.13.5** – React component library
- **Chart.js 4.4.6** – Data visualization (pie, doughnut, bar charts)
- **@auth0/nextjs-auth0 3.5.0** – Auth0 authentication
- **@stripe/react-stripe-js** – Stripe payment integration

### Backend
- **Flask (Python)** – REST API server
- **MongoDB** – NoSQL database for member, committee, and budget data
- **PyMongo** – Python MongoDB driver
- **python-dotenv** – Environment variable management

### Third-Party Services
- **Google Sheets API** – Dynamic budget/membership data source
- **Auth0** – User authentication and role management
- **Stripe** – Payment processing and webhooks
- **MongoDB Atlas** (optional) – Cloud database hosting

---

## Prerequisites

Before setting up the project, ensure you have:

- **Node.js 18+** ([download](https://nodejs.org/))
- **Python 3.8+** ([download](https://www.python.org/))
- **MongoDB 5.0+** running locally or connection string for MongoDB Atlas
- **Git** ([download](https://git-scm.com/))
- **Auth0 account** ([sign up](https://auth0.com/)) – for authentication
- **Stripe account** ([sign up](https://stripe.com/)) – for payment processing
- **Google Cloud Project** with Sheets API enabled and service account credentials
- **A Google Sheet** with budget and membership data structured as described below

### Service Account Setup (Google Sheets)

1. Create a Google Cloud project
2. Enable the Google Sheets API
3. Create a service account and download the JSON credentials file
4. Share your Google Sheet with the service account email (found in the JSON file)
5. Place the credentials file at `pages/service_account.json` (or set `GOOGLE_SHEETS_SERVICE_ACCOUNT_PATH` env var)

---

## Environment Setup (.env.local)

Create a `.env.local` file in the project root with the following variables. This file is automatically loaded by both the Next.js frontend and Flask backend.

### Frontend Variables (Next.js)

```env
# Auth0 Configuration
AUTH0_SECRET=<generate-a-32-byte-base64-random-string>
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://<YOUR_AUTH0_DOMAIN>.auth0.com
AUTH0_CLIENT_ID=<your-auth0-client-id>
AUTH0_CLIENT_SECRET=<your-auth0-client-secret>

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_<your-stripe-publishable-key>
STRIPE_SECRET_KEY=sk_test_<your-stripe-secret-key>

# Backend API
NEXT_PUBLIC_API_BASE=http://localhost:5000

# Google Sheets Configuration
NEXT_PUBLIC_GOOGLE_SHEETS_ID=<your-google-sheet-id>
NEXT_PUBLIC_GOOGLE_SHEETS_RANGE=Sheet1!A1:C500
```

### Backend Variables (Flask)

```env
# MongoDB Connection
CONNECTION_STRING=mongodb://localhost:27017/budgetcents
# OR for MongoDB Atlas:
# CONNECTION_STRING=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/budgetcents?retryWrites=true&w=majority

# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_<your-stripe-webhook-secret>
```

### Generating AUTH0_SECRET

Generate a secure random string using Python:

```bash
python -c "import secrets; import base64; print(base64.b64encode(secrets.token_bytes(32)).decode('utf-8'))"
```

Or use OpenSSL:

```bash
openssl rand -base64 32
```

### Complete .env.local Example

```env
# Auth0
AUTH0_SECRET=aB1cD2eF3gH4iJ5kL6mN7oP8qR9sT0uVwXyZaBc=
AUTH0_BASE_URL=http://localhost:3000
AUTH0_ISSUER_BASE_URL=https://dev-10skty5a3g6i203c.us.auth0.com
AUTH0_CLIENT_ID=abcdef123456ghijklmno
AUTH0_CLIENT_SECRET=your-auth0-client-secret

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51abc123def456ghi789
STRIPE_SECRET_KEY=sk_test_abcdef123456ghijklmno

# API Base
NEXT_PUBLIC_API_BASE=http://localhost:5000

# Google Sheets
NEXT_PUBLIC_GOOGLE_SHEETS_ID=1a2b3c4d5e6f7g8h9i0j
NEXT_PUBLIC_GOOGLE_SHEETS_RANGE=Sheet1!A1:C500

# MongoDB
CONNECTION_STRING=mongodb://localhost:27017/budgetcents
STRIPE_WEBHOOK_SECRET=whsec_test_abcdef123456
```

### Environment Variable Notes

- **AUTH0_SECRET**: Used for session encryption. Keep this secret and never commit it.
- **NEXT_PUBLIC_*** variables are visible on the frontend (don't put secrets here).
- **CONNECTION_STRING**: For local development, MongoDB should be running on port 27017.
- **STRIPE_WEBHOOK_SECRET**: Get this from your Stripe dashboard under Webhooks.
- **Google Sheets ID**: Extract from the sheet's URL: `https://docs.google.com/spreadsheets/d/SHEET_ID/edit`

---

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/UTDTechCohort/budgetcents.git
cd budgetcents
```

### 2. Frontend Setup (Next.js)

Install Node dependencies:

```bash
npm install
```

### 3. Backend Setup (Flask)

Navigate to the server directory and create a virtual environment:

```bash
cd server
python -m venv venv
```

Activate the virtual environment:

**Windows (PowerShell):**
```powershell
.\venv\Scripts\Activate.ps1
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

### 4. Database Setup

Ensure MongoDB is running. For local development:

```bash
# If MongoDB is installed locally, start the service
mongod
```

**For MongoDB Atlas (cloud):**
- Get your connection string from MongoDB Atlas
- Set it in `.env.local` as `CONNECTION_STRING`

### 5. Configure Google Sheets

1. Place your Google service account JSON file at `pages/service_account.json`
2. Add your Google Sheet ID to `.env.local` as `NEXT_PUBLIC_GOOGLE_SHEETS_ID`
3. Ensure your Google Sheet contains these sections:
   - **Expense Breakdown**: Header followed by rows with expense name and amount
   - **AKPsi Membership Structure**: Header followed by rows with membership category and count

Example sheet structure:
```
Expense Breakdown
Nationals            $5,000
Events               $3,500
Grand Total

AKPsi Membership Structure
Active               57
Part-Time LOA        7
LOA                  21
Pledges              22
```

---

## Running Locally

### Start All Services

Open 3 terminal windows in the project root:

**Terminal 1 – Frontend (Next.js)**
```bash
npm run dev
```
- Runs on `http://localhost:3000`
- API routes available at `http://localhost:3000/api/*`

**Terminal 2 – Backend (Flask)**
```bash
cd server
# Activate virtual environment (if not already active)
# On Windows: .\venv\Scripts\Activate.ps1
# On macOS/Linux: source venv/bin/activate
python server.py
```
- Runs on `http://localhost:5000`

**Terminal 3 – Stripe Webhook Listener (optional, for testing webhooks)**
```bash
stripe listen --forward-to localhost:5000/webhook
```
- Forwards Stripe events to your local server
- Displays webhook signing secret (add to `.env.local` as `STRIPE_WEBHOOK_SECRET`)

### Access the Application

1. Open `http://localhost:3000` in your browser
2. Click **Sign Up** or **Log In** via Auth0
3. On first login, an Auth0 user will be created
4. Navigate to `/dashboards` (admin-only, requires `role: admin` in Auth0)
5. View budget and membership charts powered by Google Sheets

### Verify API Endpoints

**Budget Expenses API:**
```bash
curl http://localhost:3000/api/google-sheets/budget
```

**Membership Structure API:**
```bash
curl http://localhost:3000/api/google-sheets/membershipStructure
```

**Backend Health Check:**
```bash
curl http://localhost:5000/
```

---

## Project Structure

```
budgetcents/
├── pages/
│   ├── _app.tsx                    # Next.js app wrapper
│   ├── _document.tsx               # HTML document wrapper
│   ├── index.tsx                   # Home page
│   ├── dashboards.tsx              # Admin dashboard
│   ├── profile.tsx                 # Member profile page
│   ├── memberForm.tsx              # Member registration form
│   ├── service_account.json        # Google Sheets credentials (add to .gitignore)
│   ├── api/
│   │   ├── fetch.ts                # Frontend API helpers
│   │   ├── webhooks.ts             # Stripe webhook handler
│   │   ├── auth/
│   │   │   └── [auth0].ts          # Auth0 integration
│   │   └── google-sheets/
│   │       ├── budget.ts           # Fetch budget/expense data
│   │       └── membershipStructure.ts # Fetch membership data
│   └── ...
├── components/
│   ├── BudgetOverview.tsx          # Budget expense pie chart
│   ├── MembershipStructureOverview.tsx # Membership pie chart
│   ├── CommitteeModal.tsx          # Committee management modal
│   ├── BudgetRequestForm.tsx       # Budget request submission
│   ├── BudgetRequestTable.tsx      # Pending requests table
│   ├── CommitteeBudgetChart.tsx    # Committee budget visualization
│   ├── OutstandingDues.tsx         # Outstanding dues table
│   ├── ServiceCarousel.tsx         # Service event carousel
│   ├── MemberProfile.tsx           # Member profile display
│   └── ...
├── lib/
│   ├── stripe-client.ts            # Stripe client-side utilities
│   └── stripe-server.ts            # Stripe server-side utilities
├── styles/
│   ├── globals.css                 # Global styles
│   └── Home.module.css             # Home page styles
├── types/
│   └── member.ts                   # TypeScript interfaces
├── server/
│   ├── server.py                   # Flask backend server
│   ├── requirements.txt            # Python dependencies
│   └── venv/                       # Python virtual environment
├── .env.local                      # Environment variables (add to .gitignore)
├── .gitignore                      # Git ignore file
├── package.json                    # Node.js dependencies
├── tsconfig.json                   # TypeScript configuration
├── next.config.ts                  # Next.js configuration
└── README.md                       # This file
```

---

## API Routes

### Google Sheets Endpoints

**GET `/api/google-sheets/budget`**
- Returns expense breakdown and budget summary
- Response:
```json
{
  "dueSummary": {
    "brotherDues": 0,
    "pledgeDues": 0,
    "availableFunds": 10500,
    "totalExpenses": 10500
  },
  "expenses": { "Nationals": 5000, "Events": 3500, "Philanthropy": 2000 },
  "expenseLabels": ["Nationals", "Events", "Philanthropy"],
  "expenseValues": [5000, 3500, 2000],
  "totalExpenses": 10500
}
```

**GET `/api/google-sheets/membershipStructure`**
- Returns membership breakdown
- Response:
```json
{
  "labels": ["Active", "Part-Time LOA", "LOA", "Pledges"],
  "values": [57, 7, 21, 22],
  "total": 107
}
```

### Backend Endpoints (Flask on :5000)

**POST `/add_committee`**
- Create or update a committee
- Request body: `{ name, budget, activities }`

**GET `/get_committees`**
- List all committees

**POST `/requests/new`**
- Submit a budget request
- Request body: `{ department, amount, description, requester, status }`

**GET `/requests`**
- Fetch pending budget requests

**GET `/requests/accepted`**
- Fetch accepted budget requests

**POST `/createMember`**
- Create a new member record

**GET `/getMemberData`**
- Fetch member information

**POST `/updateStatus`**
- Update member status (active, LOA, part-time)

### Auth0 Routes

**GET `/api/auth/login`** – Redirect to Auth0 login  
**GET `/api/auth/logout`** – Log out and clear session  
**GET `/api/auth/callback** – Auth0 callback after login  
**GET `/api/auth/me`** – Get current user info (JSON)

---

## Configuration

### Auth0 Setup

1. Sign up at [Auth0](https://auth0.com/)
2. Create a new application (Regular Web Application)
3. Set Allowed Callback URLs: `http://localhost:3000/api/auth/callback`
4. Set Allowed Logout URLs: `http://localhost:3000`
5. Copy your Client ID, Client Secret, and Domain
6. Add to `.env.local`:
   ```env
   AUTH0_CLIENT_ID=your-client-id
   AUTH0_CLIENT_SECRET=your-client-secret
   AUTH0_ISSUER_BASE_URL=https://your-domain.auth0.com
   ```

### Stripe Setup

1. Sign up at [Stripe](https://stripe.com/)
2. Go to Dashboard → Developers → API Keys
3. Copy your Publishable and Secret keys
4. Create a webhook endpoint at `http://localhost:5000/webhook`
5. Get the webhook signing secret and add to `.env.local`:
   ```env
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Google Sheets API Setup

1. Create a Google Cloud project
2. Enable Google Sheets API
3. Create a service account and download JSON credentials
4. Share your Google Sheet with the service account email
5. Place credentials at `pages/service_account.json`
6. Add Sheet ID to `.env.local`:
   ```env
   NEXT_PUBLIC_GOOGLE_SHEETS_ID=1a2b3c4d...
   ```

---

## Troubleshooting

### MongoDB Connection Errors
- **Error**: `Failed to connect to localhost:27017`
- **Fix**: Ensure MongoDB is running (`mongod` on your system)
- **Alternative**: Use MongoDB Atlas connection string in `.env.local`

### Auth0 "issuerBaseURL must be a valid uri" Error
- **Error**: `issuerBaseURL must be a valid uri`
- **Fix**: Ensure `AUTH0_ISSUER_BASE_URL` includes `https://` (e.g., `https://dev-xxx.us.auth0.com`)

### Auth0 "secret is required" Error
- **Error**: `secret is required`
- **Fix**: Generate and add `AUTH0_SECRET` to `.env.local` using the commands above

### Google Sheets API Returns Empty Data
- **Issue**: Expense/membership charts show no data
- **Check**:
  1. Is service account JSON at `pages/service_account.json`?
  2. Is the sheet shared with the service account email?
  3. Does the sheet contain "Expense Breakdown" and "AKPsi Membership Structure" headers?
  4. Check server logs for debug output: `[api]`, `[parse]`, `[sheets]` prefixes

### Stripe Webhook Not Receiving Events
- **Issue**: Payment events not processing
- **Fix**:
  1. Run `stripe listen --forward-to localhost:5000/webhook`
  2. Copy the webhook signing secret to `.env.local` as `STRIPE_WEBHOOK_SECRET`
  3. Restart Flask server

### Frontend/Backend Mismatch (CORS Errors)
- **Error**: `Access to XMLHttpRequest blocked by CORS policy`
- **Fix**: Ensure `NEXT_PUBLIC_API_BASE` in `.env.local` matches your Flask server URL
- **Default**: `http://localhost:5000`

### Charts Not Displaying
- **Issue**: Chart.js pie charts render but show no data
- **Check**:
  1. Open browser DevTools → Network tab
  2. Check if `/api/google-sheets/budget` and `/api/google-sheets/membershipStructure` return data
  3. Check Console for JavaScript errors
  4. Verify Google Sheets sheet structure and data formatting

### 404 Errors on Dashboard
- **Error**: Dashboard page returns 404 or displays "Wrong place!"
- **Fix**: Ensure your Auth0 user has `role: admin`
  1. Log in to Auth0 dashboard
  2. Go to Users → Select your user
  3. Under "Roles", add the admin role
  4. Refresh the browser

---

## Development Tips

### Hot Reload

Both the Next.js frontend and Flask backend support hot reload in development:
- **Frontend**: Changes to React components auto-refresh
- **Backend**: Use `flask run --reload` or restart manually

### Debugging

**Frontend debugging:**
- Use browser DevTools (F12) for React/JavaScript debugging
- Check Network tab for API calls
- Use `console.log()` in components

**Backend debugging:**
- Flask logs appear in terminal running `python server.py`
- Use print statements or Python logging
- Check `.env.local` is being loaded correctly

### Database Management

**View MongoDB collections:**
```bash
mongosh  # MongoDB shell
use budgetcents
db.members.find()  # List members
db.committees.find()  # List committees
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make changes and test locally
4. Commit: `git commit -am 'Add your feature'`
5. Push: `git push origin feature/your-feature`
6. Open a Pull Request

---

## License

This project is part of the UT Dallas AKPsi Tech Cohort initiative. For licensing questions, contact the maintainers.

---

## Support

For issues, questions, or suggestions, please:
- Open an issue on [GitHub](https://github.com/UTDTechCohort/budgetcents/issues)
- Contact the development team

---

**Last Updated**: December 2025  
**Version**: 1.0.0
