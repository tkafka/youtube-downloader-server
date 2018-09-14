const ytdl = require('ytdl-core');
const express = require('express');
const escape = require('html-escape');
const slug = require('slug');
const app = express();

app.get('/', (req, res) => {
	var error = null;
	var videoId = null;

	if (typeof req.query.url === 'string' && req.query.url !== "") {
		if (ytdl.validateURL(req.query.url)) {
			videoId = ytdl.getVideoID(req.query.url);
		} else {
			error = `I couldn't get youtube video id from "${escape(req.query.url)}", check the address.`;
		}
	}

	if (!videoId) {
		// res.status(400).send("Video not found.\nUsage: ?url=<youtube url>");
		res.status(400).send(`<!doctype html>
			<html>
				<head>
					<title>YT downloader</title>
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<style>
						body, html, input { font-size: 1rem; line-height: 1.75rem; }
						body { margin: 1em; }
						input { display: inline-block; background: white; color: black; border: 1px solid #ddd; border-radius: 4px; margin: 0 .5rem .5rem; padding: 0.25rem 0.5rem; }
						input[type="url"] { width: 30em; max-width: 90%; }
						input[type="submit"] {  background: #f4f4f4; }
						.error { color: red; }
					</style>
				</head>
				<body>
					${error ? '<p class="error">'+error+'</p>' : ''}
					<form method="get">
						<input name="url" type="url" placeholder="Paste Youtube URL here ..." value="${req.query.url ? escape(req.query.url) : ''}" />
						<input name="submit" type="submit" value="Download" />
					</form>
				</body>
			</html>
		`);
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