
const express = require('express');
const playback = require('./playback');
const axios = require('axios');

const scopes = [
  'ugc-image-upload',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'streaming',
  'app-remote-control',
  'user-read-email',
  'user-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-read-private',
  'playlist-modify-private',
  'user-library-modify',
  'user-library-read',
  'user-top-read',
  'user-read-playback-position',
  'user-read-recently-played',
  'user-follow-read',
  'user-follow-modify'
];

const DATADOG_API_KEY = '8150063804de46eeb666325485470945';
const DATADOG_API_URL = 'https://api.datadoghq.com/api/v1/series';

let refresh_token = null

const spotifyApi = require('./spotify');

const app = express();

app.get('/login', (req, res) => {
  res.redirect(spotifyApi.createAuthorizeURL(scopes));
});

app.get('/callback', (req, res) => {
  const error = req.query.error;
  const code = req.query.code;
  const state = req.query.state;

  if (error) {
    console.error('Callback Error:', error);
    res.send(`Callback Error: ${error}`);
    return;
  }

  spotifyApi
    .authorizationCodeGrant(code)
    .then(data => {
      let access_token = data.body['access_token'];
    refresh_token = data.body['refresh_token'];
      let expires_in = data.body['expires_in'];

      spotifyApi.setAccessToken(access_token);
      spotifyApi.setRefreshToken(refresh_token);
    //   playback.useAccessToken(access_token, refresh_token);

      console.log('access_token:', access_token);
      console.log('refresh_token:', refresh_token);
    playback.getUserInfo();
    playback.getData();


      console.log(
        `Sucessfully retreived access token. Expires in ${expires_in} s.`
      );
      res.send('Success! You can now close the window.');

      setInterval(async () => {
        await refreshAccessToken();
      }, 330000);
    })
    .catch(error => {
      console.error('Error getting Tokens:', error);
      res.send(`Error getting Tokens: ${error}`);
    });
});

async function refreshAccessToken() {
    try {
      const data = await spotifyApi.refreshAccessToken();
      const { access_token } = data.body;
      spotifyApi.setAccessToken(access_token);
      console.log('Access token has been successfully refreshed.');
    } catch (error) {
      console.error('Failed to refresh access token:', error);
    }
  }




app.listen(5000, () => {
  console.log(
    'HTTP Server up. Now go to http://localhost:5000/login in your browser.'
  );
}
  
);