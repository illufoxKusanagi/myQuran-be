# Use official Bun image as base
FROM oven/bun:1

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package files first to leverage Docker layer caching
COPY package.json bun.lock tsconfig.json ./

# Install all dependencies (development dependencies are okay for local dev environments)
RUN bun install

# Command to run the development server with hot reload
CMD ["bun", "run", "--watch", "src/index.ts"]
