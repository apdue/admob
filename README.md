# AdMob Dashboard

A Next.js web application for viewing and analyzing AdMob reports and statistics.

## Features

- Google Cloud Authentication
- AdMob Account Details
- Revenue Reports with Charts
- Date Range Selection
- Interactive Data Visualization

## Prerequisites

1. Google Cloud CLI installed
2. Node.js 18+ installed
3. Access to an AdMob account
4. Google Cloud project with AdMob API enabled

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd admob-dashboard
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with your Google Cloud project ID:
```bash
GOOGLE_CLOUD_PROJECT=your-project-id
```

4. Authenticate with Google Cloud:
```bash
gcloud auth application-default login --scopes="https://www.googleapis.com/auth/cloud-platform,https://www.googleapis.com/auth/admob.readonly" --no-launch-browser
```

## Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Routes

- `GET /api/admob/accounts` - Fetch AdMob account details
- `POST /api/admob/reports` - Generate AdMob reports with date range

## Technologies Used

- Next.js 14
- TypeScript
- Tailwind CSS
- Recharts
- Google Auth Library
- Google Cloud CLI

## License

MIT
