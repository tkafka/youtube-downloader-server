const ytdl = require('ytdl-core');
const express = require('express');
const slug = require('slug');
const url = require('url');
const app = express();

app.get('/', (req, res) => {
	var videoId = null;
	if (ytdl.validateURL(req.query.url)) {
		videoId = ytdl.getVideoID(req.query.url);
	}

	if (!videoId) {
		res.status(400).send("Video not found.\nUsage: ?url=<youtube url>");
		return;
	}

	console.log(videoId, 'Getting video');

	let options = {
		quality: req.query.quality || 'highest',
		filter: (format) => format.container === 'mp4',
		format: req.query.format || undefined,
	};

	const stream = ytdl(req.query.url, options);

	stream.on('info', (info) => {
		// info.title;
		let name = 'yt-' + videoId;
		if (info.title) {
			name = slug(info.title);
		}
		res.setHeader('Content-disposition', `attachment; filename=${name}.mp4`);

		// console.log(videoId, 'info', info); 
		console.log(videoId, 'info', name); 
	});
	stream.on('response', (response) => {
		if (response.headers['content-length']) {
			res.setHeader('Content-length', response.headers['content-length']);
		}
		if (response.headers['content-type']) {
			res.setHeader('Content-type', response.headers['content-type']);
		}
		console.log(videoId, 'response', response.headers['content-type'], response.headers['content-length']);
	});

	stream.pipe(res);
});

const port = process.env.PORT || 3000;
app.listen(port, () => { 
	console.log(`Listening on http://localhost:${port}`); 
	console.log(`Try eg. http://localhost:${port}?url=https://www.youtube.com/watch?v=e0UWT0dFSQE`); 
});