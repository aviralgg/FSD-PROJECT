#  Faculty-Feedback-Analysis backend

## Overview
This is the backend server for the Faculty Feedback system. It handles APIs for collecting and analyzing student feedback for faculty members.

## 🚀 Tech Stack

- **Node.js** with **Express.js**
- **MongoDB** with **Mongoose**
- **JWT** for authentication
- **dotenv** for environment configuration
- **Multer** for faculty image upload on **Cloudinary Server**

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm

### Setup
1. Clone the repository
   ```
   git clone https://github.com/aviralgg/Faculty-Feedback-Analysis.git
   cd Faculty-Feedback-Analysis
   cd backend
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up environment variables
   Create a `.env` file in the root directory and copy the variables from:
   ```
   .env.sample
   ```

4. Start the server
   ```
   npm run dev
   ```