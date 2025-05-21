#!/bin/bash

# Set environment variables
export NODE_ENV="development"

# Remove the old database if it exists
rm -f local.db

# Run database migrations
echo "Running database migrations..."
npm run db:migrate
npm run db:push

# Run the development server
echo "Starting development server..."
npm run dev 