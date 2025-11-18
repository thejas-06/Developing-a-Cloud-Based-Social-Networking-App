# Social Media Application

A full-stack social media platform built with the MERN stack (MongoDB, Express.js, React, Node.js) featuring user authentication with 2-factor authentication, real-time messaging, post creation, commenting, and user interactions.

## Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
  - [Authentication](#authentication)
  - [Users](#users)
  - [Posts](#posts)
  - [Comments](#comments)
  - [Messages](#messages)
- [Folder Structure](#folder-structure)
- [Contributing](#contributing)
- [License](#license)

## Features

- User registration and authentication with JWT tokens
- Two-factor authentication (2FA) support
- Create, edit, and delete posts with title and content
- Like and unlike posts
- Comment on posts with nested comments
- Real-time messaging between users using Socket.IO
- User profiles with biographies
- Follow/unfollow other users
- View followers and following lists
- Explore posts from other users
- Responsive UI built with Material-UI
- Profanity filtering for user-generated content
- Rate limiting for API protection
- Security features (CORS, Helmet, Compression)

## Technologies Used

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - Object Data Modeling (ODM) library
- **Socket.IO** - Real-time web socket communication
- **JWT** - JSON Web Tokens for authentication
- **Bcrypt** - Password hashing
- **Speakeasy** - Two-factor authentication
- **Validator** - Data validation
- **Helmet** - Security headers
- **Compression** - Response compression
- **Rate Limiting** - API request limiting

### Frontend
- **React** - JavaScript library for building user interfaces
- **Material-UI** - UI component library
- **React Router** - Declarative routing
- **Formik** - Form handling
- **Axios** - HTTP client
- **Socket.IO Client** - Real-time communication client

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/thejas-06/social-media-app.git
   ```

2. Install backend dependencies:
   ```bash
   cd social-media-app
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd client
   npm install
   ```

4. Create a `.env` file in the root directory with the following variables:
   ```
   MONGO_URI=your_mongodb_connection_string
   TOKEN_KEY=your_jwt_secret_key
   REFRESH_TOKEN_KEY=your_refresh_token_secret_key
   ```

5. Start the development servers:
   
   a. In the first terminal, start the backend server:
   ```bash
   # Make sure you are in the root directory (where server.js is located)
   npm run server
   ```
   
   b. Open a new terminal window/tab, then navigate to the client directory and start the frontend server:
   ```bash
   # Navigate to the client directory
   cd client
   npm start
   ```
   
   Note: Both servers need to be running simultaneously for the full application to work properly. The frontend communicates with the backend through API calls.

## Usage

1. Register for a new account or log in with existing credentials
2. Enable 2-factor authentication in your profile settings for enhanced security
3. Create posts with titles and content
4. Interact with other users' posts by liking and commenting
5. Follow other users to see their posts in your feed
6. Use the messenger to communicate with other users in real-time
7. Update your profile information and biography


## Folder Structure

```
social-media-app/
├── client/                 # React frontend
│   ├── public/             # Static assets
│   └── src/
│       ├── api/            # API service files
│       ├── components/     # React components
│       │   ├── util/       # Utility components
│       │   └── views/      # Page components
│       ├── helpers/        # Helper functions
│       ├── App.js          # Main App component
│       ├── config.js       # Configuration file
│       ├── index.js        # Entry point
│       └── theme.js        # Material-UI theme
├── controllers/            # Request handlers
├── middleware/             # Custom middleware
├── models/                 # Mongoose models
├── routes/                 # API routes
├── util/                   # Utility functions
├── server.js               # Main server file
├── socketServer.js         # Socket.IO server
├── package.json            # Backend dependencies
└── README.md               # This file
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch: `git checkout -b feature-name`
3. Make your changes and commit them: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.