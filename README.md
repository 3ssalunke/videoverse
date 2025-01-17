# Video Service

## Overview

This project provides a video processing service that supports operations such as trimming, merging, sharing, and accessing video files. It uses Express, Prisma for database interaction, and file system operations for video file handling.

## Prerequisites

- Node.js v20.15 or higher
- FFmpeg binary installed and available in your system's PATH

## Setting up the project

### 1. Clone the repository

```bash
git clone <repository-url>
cd <project-directory>
```

### 2. Install dependencies

Run the following command to install project dependencies:

```bash
npm install
```

### 3. Install FFmpeg

For video processing, the FFmpeg binary is required. You can install it by following the instructions based on your operating system:

macOS: Install via Homebrew

```bash
brew install ffmpeg
```

Linux (Ubuntu):

```bash
sudo apt update
sudo apt install ffmpeg
```

Windows: Download the FFmpeg binary from [FFmpeg official website](https://ffmpeg.org/download.html), extract it, and add the `bin` directory to your PATH environment variable.

### 4. Check enviroment variables

Make sure that the .env file has all the environment variables with correct values.

### 5. Setup local database(Optional)

Run the following command to generate Prisma migration files and set up the database:

```bash
npx prisma migrate dev
```

### 6. Start the application by running

```bash
npm run start:dev
```

This will start the server on the default port (usually 8000).

### 7. Running Tests

To run tests for this project, make sure you have the necessary environment set up, including the database and FFmpeg binary. Once set up, run the following command:

```bash
npm run test
```

To get unit test coverage, run the following command:

```bash
npm run test:coverage
```

## Postman Documentation

You can import the provided Postman JSON file into Postman to explore and test the API endpoints.

## References

### 1. **Prisma Documentation**

- [Prisma Documentation](https://www.prisma.io/docs/)

### 2. **FFmpeg Installation**

- [FFmpeg Official Website](https://ffmpeg.org/)
- [Install FFmpeg on Windows](https://www.wikihow.com/Install-FFmpeg-on-Windows)
- [NPM fluent-ffmpeg](https://www.npmjs.com/package/fluent-ffmpeg)

### 3. **Multer for File Uploads**

- [Multer Documentation](https://www.npmjs.com/package/multer)

### 4. **Testing with Jest**

- [Jest Documentation](https://jestjs.io/docs/getting-started)
