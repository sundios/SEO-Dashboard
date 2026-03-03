# GSC Dashboard

A full-featured Google Search Console analytics dashboard built with Next.js and a Flask backend. Provides traffic analysis, keyword insights, URL inspection, sitemap management, and AI-powered analysis.

![Next.js](https://img.shields.io/badge/Next.js-15.3-black)
![Flask](https://img.shields.io/badge/Flask-2.3-green)
![Chart.js](https://img.shields.io/badge/Chart.js-4.4-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)

## Features

### Traffic Performance
- Daily clicks, impressions, CTR, and average position charts
- Query, page, and country breakdowns with sortable/filterable tables
- Device filtering (desktop, mobile, tablet)
- Date range presets (7 days to 16 months)
- CSV export for daily data and query data
- Google Algorithm Update annotations on charts (toggle on/off)
- AI-powered daily and query insights via OpenAI

### Sites Overview
- Multi-site comparison dashboard
- Up to 6 sites displayed simultaneously
- Configurable time period and device filters

### Correlation Matrix
- Scatter plot correlation matrix for clicks, impressions, CTR, and position
- Visual analysis of metric relationships across queries

### Traffic Insights (Winners & Losers)
- Compare keyword and URL performance between two dates
- Top 20 winners (growth in clicks) and top 20 losers (decline in clicks)
- Horizontal bar chart showing keyword contribution to click change
- Date range presets: 30 days, 3 months, 6 months, 9 months, 12 months, custom
- Accounts for 3-day GSC API data lag

### URL Inspection
- Inspect any URL's index status in Google Search Console
- View coverage state, crawl details, mobile usability, and rich results

### Sitemap Management
- List all sitemaps for a site
- Submit new sitemaps
- Delete existing sitemaps
- View sitemap details and URL counts

### Settings
- Configure Google Search Console credentials path
- Authorize GSC API access
- Set OpenAI API key for AI insights
- Select up to 6 sites for the overview dashboard

## Tech Stack

### Frontend
- **Next.js 15** with App Router and TypeScript
- **Tailwind CSS** for styling
- **Chart.js** with annotation plugin for charting
- **Radix UI** for accessible UI primitives
- **TanStack Table** for data tables
- **React Markdown** for rendering AI insights
- **FontAwesome** for icons

### Backend
- **Flask** with CORS support
- **Google API Python Client** for GSC API access
- **OpenAI** for AI-powered insights
- **Pandas** for data processing

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- Google Search Console API credentials (`client_secret.json`)

### 1. Install frontend dependencies

```bash
cd gsc-dashboard
npm install
```

### 2. Set up the Python virtual environment

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r backend_requirements.txt
```

### 3. Configure credentials

1. Go to the **Settings** page in the dashboard
2. Set the path to your Google Search Console `client_secret.json` file
3. Click **Authorize Credentials**
4. (Optional) Set your OpenAI API key for AI insights

### 4. Start the backend

```bash
source venv/bin/activate
python3 backend_api.py
```

The backend runs on `http://localhost:5001`.

### 5. Start the frontend

```bash
npm run dev
```

The frontend runs on `http://localhost:3000`.

## Project Structure

```
gsc-dashboard/
├── src/
│   ├── app/                         # Next.js pages
│   │   ├── page.tsx                 # Traffic Performance (main dashboard)
│   │   ├── layout.tsx               # Root layout with sidebar
│   │   ├── overview/                # Sites Overview
│   │   ├── performance/             # Correlation Matrix
│   │   ├── traffic-insights/        # Winners & Losers
│   │   ├── url-inspection/          # URL Inspection
│   │   ├── sitemap/                 # Sitemap Management
│   │   └── settings/                # Settings
│   ├── components/
│   │   ├── dashboard/               # Dashboard-specific components
│   │   ├── layout/                  # Sidebar, Header, AuthBanner
│   │   └── ui/                      # Reusable UI components
│   └── contexts/
│       └── DataContext.tsx           # Global state management
├── backend_api.py                   # Flask backend API
├── backend_requirements.txt         # Python dependencies
├── dashboard_config.json            # App configuration (auto-generated)
├── package.json                     # Node.js dependencies
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/status` | Backend status and GSC connection info |
| GET | `/api/sites` | List verified GSC sites |
| GET | `/api/data` | Fetch GSC analytics data |
| GET | `/api/top-queries` | Get top performing queries |
| GET | `/api/settings` | Get current settings |
| POST | `/api/settings` | Save settings |
| POST | `/api/authorize` | Authorize GSC credentials |
| POST | `/api/settings/clear` | Clear all credentials |
| POST | `/api/insights/daily` | Generate AI insights for daily data |
| POST | `/api/insights/queries` | Generate AI insights for query data |
| POST | `/api/url-inspect` | Inspect a URL via GSC API |
| GET | `/api/sitemaps` | List sitemaps for a site |
| GET | `/api/sitemaps/get` | Get sitemap details |
| POST | `/api/sitemaps/submit` | Submit a new sitemap |
| POST | `/api/sitemaps/delete` | Delete a sitemap |

## Configuration

The app stores configuration in `dashboard_config.json`:

```json
{
  "openaiApiKey": "",
  "credentialsPath": "/path/to/client_secret.json",
  "isAuthorized": false,
  "overviewSites": []
}
```

## Algorithm Updates

The dashboard includes Google algorithm update dates (2024-2025) that can be displayed as annotations on the traffic chart:

- December 2025 core update
- August 2025 spam update
- June 2025 core update
- March 2025 core update
- December 2024 spam update
- December 2024 core update
- November 2024 core update

Toggle annotations on/off using the "Show Algorithm Updates" button on the chart.

## License

This project is for personal/internal use.
