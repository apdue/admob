# AdMob Dashboard

A Next.js application for viewing and analyzing AdMob revenue data.

## Features

- Real-time AdMob revenue tracking
- Detailed analytics with country and app-wise breakdowns
- Interactive data tables with sorting and filtering
- Summary views for quick insights
- Responsive design for all devices

## Setup

1. Clone the repository:
```bash
git clone https://github.com/apdue/admob.git
cd admob
```

2. Install dependencies:
```bash
npm install
```

3. Environment Variables:
All configuration is stored in `src/config/constants.ts`. No additional environment setup is needed as all required values are included in the codebase.

4. Run the development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

6. Start production server:
```bash
npm start
```

## Configuration

All configuration values are stored in `src/config/constants.ts`. This includes:

- Google Cloud Project ID
- API Configuration
- AdMob Settings
- Date Formats

## API Routes

The application includes the following API routes:

- `/api/admob/accounts` - Get AdMob account information
- `/api/admob/reports` - Generate AdMob reports with customizable parameters

## Development

### Project Structure

```
admob/
├── src/
│   ├── app/
│   │   ├── api/         # API routes
│   │   ├── components/  # React components
│   │   └── page.tsx     # Main page
│   └── config/
│       └── constants.ts # Configuration
├── public/             # Static files
└── package.json       # Dependencies and scripts
```

### Technologies Used

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Google AdMob API

## Production Deployment

1. Push to the main branch:
```bash
git add .
git commit -m "your commit message"
git push origin main
```

2. Deploy to your hosting platform (e.g., Vercel)

## License

MIT License - See LICENSE file for details

## Support

For support, please open an issue in the GitHub repository.
