#!/bin/bash

# Script to toggle DEBUG_MODE in .env.local

ENV_FILE=".env.local"

# Check if file exists
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE does not exist"
  exit 1
fi

# Current value
CURRENT_VALUE=$(grep "NEXT_PUBLIC_DEBUG_MODE" "$ENV_FILE" | cut -d'=' -f2)

if [ "$CURRENT_VALUE" = "true" ]; then
  # Change to false
  sed -i '' 's/NEXT_PUBLIC_DEBUG_MODE=true/NEXT_PUBLIC_DEBUG_MODE=false/' "$ENV_FILE"
  echo "Debug mode disabled (NEXT_PUBLIC_DEBUG_MODE=false)"
else
  # Change to true
  sed -i '' 's/NEXT_PUBLIC_DEBUG_MODE=false/NEXT_PUBLIC_DEBUG_MODE=true/' "$ENV_FILE"
  echo "Debug mode enabled (NEXT_PUBLIC_DEBUG_MODE=true)"
fi