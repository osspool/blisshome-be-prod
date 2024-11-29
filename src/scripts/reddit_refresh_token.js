// import axios from "axios";
// import express from "express";
// import dotenv from "dotenv";
// dotenv.config();

// const CLIENT_ID = process.env.REDDIT_CLIENT_ID
// const CLIENT_SECRET = process.env.REDDIT_CLIENT_SECRET
// const REDIRECT_URI = 'http://localhost:3002/reddit_callback'; //this is set in the redit console: https://www.reddit.com/prefs/apps

// const app = express();

// app.get('/auth', (req, res) => {
//   const authUrl = `https://www.reddit.com/api/v1/authorize?client_id=${CLIENT_ID}&response_type=code&state=randomstring&redirect_uri=${REDIRECT_URI}&duration=permanent&scope=read`;
//   res.redirect(authUrl);
// });

// app.get('/reddit_callback', async (req, res) => {
//   const code = req.query.code;
//   try {
//     const response = await axios.post('https://www.reddit.com/api/v1/access_token', 
//       `grant_type=authorization_code&code=${code}&redirect_uri=${REDIRECT_URI}`,
//       {
//         auth: {
//           username: CLIENT_ID,
//           password: CLIENT_SECRET
//         },
//         headers: {
//           'Content-Type': 'application/x-www-form-urlencoded'
//         }
//       }
//     );
//     console.log('Refresh Token:', response.data.refresh_token);
//     res.send('Check your console for the refresh token!');
//   } catch (error) {
//     console.error('Error:', error.response.data);
//     res.status(500).send('Error getting token');
//   }
// });

// app.listen(3002, () => console.log('Server running on http://localhost:3002'));