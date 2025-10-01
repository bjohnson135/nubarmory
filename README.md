# NubArmory - Premium Sword Hilt Cigar Nub Holders

Veteran-owned e-commerce platform for 3D printed sword hilt cigar nub holders with custom design options.

## Features

- **Product Catalog** - Browse premium sword-themed cigar holders
- **Custom Orders** - Request personalized designs
- **Multiple Payment Options** - Stripe, PayPal, Venmo, Apple Pay support
- **Shopping Cart** - Full cart management system
- **Responsive Design** - Mobile-friendly interface
- **Order Management** - Track and manage orders

## Tech Stack

- **Next.js 15** with TypeScript and Turbopack
- **Tailwind CSS** for styling
- **Prisma** with SQLite database
- **Stripe & PayPal** for payments
- **Zustand** for state management

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository
```bash
cd nubarmory
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
Create `.env.local` file with your API keys:
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_pk
STRIPE_SECRET_KEY=your_stripe_sk
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_id
```

4. Initialize database
```bash
npx prisma migrate dev
```

5. Run development server
```bash
npm run dev
```

Visit `http://localhost:3000` to view the application.

## Project Structure

```
nubarmory/
├── app/              # Next.js app directory
├── components/       # React components
├── lib/             # Utility functions
├── prisma/          # Database schema
├── public/          # Static assets
└── types/           # TypeScript types
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Payment Integration

The app supports multiple payment methods:
- **Credit/Debit Cards** via Stripe
- **PayPal** integration
- **Venmo** (UI ready, integration pending)
- **Apple Pay** (UI ready, integration pending)

## Custom Orders

Customers can request custom designs with:
- Detailed description
- Budget selection
- Timeline preferences
- Reference image uploads

## Database Schema

Uses Prisma ORM with models for:
- Products
- Orders & Order Items
- Custom Orders
- Admin Users

## Deployment

Build for production:
```bash
npm run build
npm run start
```

## License

All rights reserved - NubArmory