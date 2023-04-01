require('dotenv').config();
const querystring = require('node:querystring');
const express = require('express');
const readline = require('node:readline');
const loadImage = require('canvas').loadImage;
const createCanvas = require('canvas').createCanvas;
const fs = require('node:fs');
const imagemin = require('imagemin');
const imageminPngquant = require('imagemin-pngquant');
const Jimp = require('jimp');

//Generate a random string to use as a state parameter
let state = '';
const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
for (let i = 0; i < 16; i++) {
	state += chars.charAt(Math.floor(Math.random() * chars.length));
}

const url =
	'https://accounts.spotify.com/authorize?' +
	querystring.stringify({
		response_type: 'code',
		client_id: process.env.CLIENT_ID,
		scope: 'user-read-private playlist-read-private',
		redirect_uri: 'http://localhost:3333',
		state: state,
	});

console.log(url);

const app = express();

app.get('/', (req, res) => {
	if (req.query.code && req.query.state === state) {
		fetch('https://accounts.spotify.com/api/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				Authorization:
					'Basic ' +
					Buffer.from(
						process.env.CLIENT_ID + ':' + process.env.CLIENT_SECRET,
					).toString('base64'),
			},
			body: querystring.stringify({
				grant_type: 'authorization_code',
				code: req.query.code,
				redirect_uri: 'http://localhost:3333',
			}),
		})
			.then((res) => {
				if (res.ok) {
					return res.json();
				}
				throw new Error('Request failed! (code ' + res.status + ')');
			})
			.then((json) => {
				const access_token = json.access_token;
				res.send('Success! You can now close this tab.');
				startApp(access_token);
				server.close();
			})
			.catch((error) => {
				console.log(error);
			});
	} else {
		console.log('No code found');
	}
});

var server = require('http').createServer(app);

server.listen(3333, () => {
	console.log('Listening on port 3333');
});

async function startApp(access_token: string) {
	console.log("Retrieving user's playlists...");

	const response = await fetch(
		'https://api.spotify.com/v1/me/playlists?limit=50',
		{
			headers: {
				Authorization: 'Bearer ' + access_token,
			},
		},
	);
	const playlists = await response.json();

	console.log('========== Playlists ==========');
	let idx = 1;
	for (const playlist of playlists.items) {
		console.log(idx++ + ') ' + playlist.name);
	}

	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});
	rl.question('Enter the index of the playlist: ', async (n) => {
		let tracks: any = [];
		let offset = 0;
		let limit = 100;
		let total = 0;
		do {
			const response = await fetch(
				'https://api.spotify.com/v1/playlists/' +
					playlists.items[n - 1].id +
					'/tracks?offset=' +
					offset +
					'&limit=' +
					limit,
				{
					headers: {
						Authorization: 'Bearer ' + access_token,
					},
				},
			);
			const playlist = await response.json();
			tracks = tracks.concat(playlist.items);
			offset += limit;
			total = playlist.total;
		} while (offset < total);

		//Remove tracks of the same artist
		const uniqueAlbums = [];
		const covers = [];
		for (const track of tracks) {
			if (
				!uniqueAlbums.includes(track.track.album.name) &&
				!covers.includes(track.track.album.images[0].url)
			) {
				uniqueAlbums.push(track.track.album.name);
				covers.push(track.track.album.images[0].url);
			}
		}

		console.log(
			'Loaded ' +
				tracks.length +
				' tracks. For ' +
				covers.length +
				' different covers.',
		);

		const canvas = createCanvas(1000, 1000);
		const ctx = canvas.getContext('2d');

		for (let i = 0; i < 25; i++) {
			const select = Math.floor(Math.random() * covers.length);
			const img = await loadImage(covers[select]);
			covers.splice(select, 1);
			ctx.drawImage(
				img,
				200 * (i % 5),
				200 * Math.floor(i / 5),
				200,
				200,
			);
		}

		const out = fs.createWriteStream('out.png');
		const stream = canvas.createPNGStream();
		stream.pipe(out);
		out.on('finish', () => {
			console.log('The PNG file was created.');

			imagemin(['out.png'], {
				destination: '.',
				plugins: [imageminPngquant()],
			}).then(() => {
				console.log('Image compressed');
			});

			rl.close();
		});
	});
}
