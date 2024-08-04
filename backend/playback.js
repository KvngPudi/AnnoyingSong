

let token = "BQBDQlTtRla2YfASgg9-4iOedeEVigjmvMAx2ltBML-rfLVqjSyDIlAmhTtTufYe9sp16b29cnI0FLdTis5t_a_YOi7bU34LisHrPw-YmrWLgWs3_PwwWsfuSb7YYo-5E5ESQDdkF-baBxZSBGCaPSaRVlCx2YGRS0fqN-rtAZn29G3g1npllqVdtJCY_aM9at7q6yuEKICSPMZCsHtwE-iZGMpk__C3JdlCcBS0VII-GqWHzEDUvInT46S-URsVJ4ATLr-StOVtzP0ALkH6ScoUh6qnSe_0N9Q3KLORScRKI_QgSXj-HrjClJiFou4-RTMq3qqcU2xMf5oduMXITymgd32rGvyr8wSLog7F160YbGPxkr-Kq8yeK35xe3NoscRsJwrSv8TWR9egjEtgoW3Pa50IJcE06FJmD9_Q8q9hPYILgE0dTmTmgUsAcKQIRX4ngv52pyIE8j_zauHeQdVpJHhmiMGpk_Z-jl3FVF0QGLD71nUq4SVjB_LG6VCbeHx4NQsCFu0"
let refresh = "AQDlWTwL2F7scb3jCsbHgww5hp6BtvwVxaQtiNMnpOZj8CeuPsLCJlUcA_81DtDug90k4TI9jsnM3oX2m201YPlXMJx5_6b7k57v3IS1PCNehpe2lHohocXZlwPc55qJr8c"
const spotifyApi = require('./spotify');
spotifyApi.setAccessToken(token);
spotifyApi.setRefreshToken(refresh);

const axios = require('axios');
const DATADOG_API_KEY = '8150063804de46eeb666325485470945';
const DATADOG_API_URL = 'https://api.datadoghq.com/api/v1/series';
const express = require('express');
const app = express();
app.use(express.json());

const StatsD = require('node-dogstatsd').StatsD;
const dogstatsd = new StatsD();

let userID = ""

function initialize() {
    console.log("Playback initialized");
   
}

module.exports = {
    initialize
};



function useAccessToken(accessToken, refresh_token) {
    // console.log(`Received token: ${accessToken}`);
    token = accessToken
    refresh = refresh_token
    
    spotifyApi.setAccessToken(token);
spotifyApi.setRefreshToken(refresh);

console.log("access token from playback: ", spotifyApi.getAccessToken());
console.log("refresh token from playback: ", spotifyApi.getRefreshToken());

}

module.exports = {
    useAccessToken
};



function getData() {
    (async () => {
        const user = await spotifyApi.getMe();
        // console.log(user.body);
        getPlaybackState(user.body.id);
    })().catch(err=> {
        console.error(err);
    })
}

let lastID = null;
let pause = 0;


async function getPlaybackState(id){

    console.log("access token from playback: ", spotifyApi.getAccessToken());
    console.log("refresh token from playback: ", spotifyApi.getRefreshToken());

    const user = spotifyApi.getUser();
    console.log(user)
   

    spotifyApi.getMyCurrentPlaybackState()
  .then(function(data) {

    if (data.body && data.body.item) {
        const songName = data.body.item.name
        const artist = data.body.item.artists.map(artist => artist.name).join(", ");
        const songID = data.body.item.id;

        const isRepeated = data.body.repeat_state === `track`;
        const isChanged = songID !== lastID;

        const trackDuration = data.body.item.duration_ms;
        const progress = data.body.progress_ms;

        console.log("trackDuration: ", trackDuration);
        console.log("progress:", progress);
        // console.log(data.body);
        // console.log("User ID from getPLaybackState:", userID);


        if (isRepeated || isChanged){
            console.log("Track Changed to:", songName);
            lastID = songID;
            sendMetrics('spotify.song.plays', 1, [
                `song_id:${songID}`,
                `user_id:${userID}`,
                `songName:${songName}`,

            ]);
        } else {
            console.log(`You are playing: ${songName} by ${artist}.\nHere is the song id: ${songID}`);
        }

        const remainingTime = trackDuration - progress;

          setTimeout(getPlaybackState, remainingTime + 3000);
          pause = 0;

    } else {
      console.log("You aren't playing anything!");

      if (pause < 2) {
        setTimeout(getPlaybackState, 90000);
        pause++;
      } else {
      setTimeout(getPlaybackState, 3600000);
      }
    }
  }, function(err) {
    console.log('Something went wrong!', err);
    setTimeout(getPlaybackState, 120000); 
  });

  time();

  

}

async function getUserInfo() {
    try {
        const response  = await axios.get('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        // console.log('User Data:', response.data.id);
        userID = response.data.id;
    }
    catch (error) {
        console.error('Error fetching user data from Spotify: ');
    }
}

function sendMetrics(name, value, id){
    console.log(`Incrementing metric: ${name} by ${value} with tags ${id}`);
    dogstatsd.increment(name, value, id);
    console.log('Metric sent to Datadog via StatsD:', name, value, id);

}

function time() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0'); 
    const seconds = now.getSeconds().toString().padStart(2, '0'); 
    console.log(`Current Time: ${hours}:${minutes}:${seconds}`);
}

module.exports = {
    getUserInfo,
    getData,
};

