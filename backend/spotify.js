const SpotifyWebApi = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebApi({
    redirectUri: 'http://localhost:5000/callback',
    clientId: 'e4ea4ade0a7c4cfa8056182aecd8b28c',
    clientSecret: 'f11f50fdc58841f6b83306916105e3e5'
  });

  
  module.exports = spotifyApi;