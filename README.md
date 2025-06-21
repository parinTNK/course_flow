# Course Flow

## Overview
Course Flow is a modern educational platform built with Next.js and TypeScript. The platform allows users to browse, purchase, and participate in online courses while providing course creators with tools to manage their content and interact with students.

## Features

### For Students
- **Course Discovery**: Browse available courses with detailed descriptions
- **User Authentication**: Secure login/registration with Supabase
- **Personal Dashboard**: Track enrolled courses and learning progress
- **Interactive Learning Experience**: Watch video content powered by Mux
- **Payment Processing**: Secure checkout using Omise payment gateway
- **Promotional Codes**: Apply discount codes during checkout
- **Assignment Management**: Submit and track assignments for enrolled courses
- **Wishlist**: Save courses for future enrollment

### For Administrators
- **Course Management**: Create, edit, and publish courses
- **Content Organization**: Structure courses with modules and lessons
- **Student Management**: View and manage student enrollments
- **Video Uploads**: Easy video uploading and streaming with Mux integration
- **Analytics Dashboard**: Track course performance and student engagement
- **Promotion Management**: Create and manage promotional codes

## Technology Stack

### Frontend
- **Next.js 15**: React framework with App Router for enhanced performance
- **TypeScript**: For type safety and improved development experience
- **Tailwind CSS**: For responsive and customizable UI
- **Radix UI**: Accessible UI components
- **React Hook Form**: For form validation and handling
- **Embla Carousel**: For interactive carousels and sliders
- **Lucide React**: For consistent icon system

### Backend & Data
- **Supabase**: Authentication, database, and storage
- **Mux**: Video hosting and streaming
- **Omise**: Payment processing

## Getting Started

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm or yarn
- Supabase account
- Mux account
- Omise account (for payment processing)

### Environment Setup

Create a `.env.local` file in the root directory with the following variables:

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Mux
MUX_TOKEN_ID=your_mux_token_id
MUX_TOKEN_SECRET=your_mux_token_secret

# Omise (Payment)
OMISE_PUBLIC_KEY=your_omise_public_key
OMISE_SECRET_KEY=your_omise_secret_key
```

### Installation

1. Clone the repository
   ```
   git clone https://github.com/parinTNK/course_flow.git
   ```

2. Navigate to the project directory
   ```
   cd course_flow
   ```

3. Install dependencies
   ```
   npm install
   ```
   or with yarn
   ```
   yarn install
   ```

4. Start the development server
   ```
   npm run dev
   ```
   or with Turbopack
   ```
   npm run dev -- --turbopack
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
course_flow/
├── public/               # Static assets
├── src/                  # Source code
│   ├── app/              # Next.js App Router
│   │   ├── admin/        # Admin dashboard routes
│   │   ├── api/          # API routes
│   │   ├── context/      # React context providers
│   │   ├── login/        # Authentication pages
│   │   ├── my-courses/   # User dashboard pages
│   │   ├── payment/      # Payment processing
│   │   └── globals.css   # Global styles
│   ├── components/       # Reusable components
│   │   ├── landing/      # Landing page components
│   │   └── ui/           # UI components
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility functions
│   │   ├── auth.ts       # Authentication helpers
│   │   ├── mux.ts        # Mux integration
│   │   ├── payment.ts    # Payment processing
│   │   └── supabaseClient.ts # Supabase client
│   ├── middleware.ts     # Next.js middleware for auth
│   └── types/            # TypeScript types
├── .env.example          # Example environment variables
├── next.config.js        # Next.js configuration
├── package.json          # Project dependencies
├── tailwind.config.js    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

## Authentication Flow

Course Flow implements a comprehensive authentication system using Supabase Auth:

- **User Registration**: New users can create accounts with email/password
- **Role-Based Access**: Separate flows for students and administrators
- **Protected Routes**: Middleware ensures authenticated access to protected content
- **Session Management**: Automatic token refresh and session persistence

## Deployment

Deploy the application using Vercel for optimal Next.js compatibility:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables
4. Deploy!

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
