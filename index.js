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
		if (!req.query.quality) {
			req.query.quality = 'highest';
		}
		// res.status(400).send("Video not found.\nUsage: ?url=<youtube url>");
		res.status(400).send(`<!doctype html>
			<html>
				<head>
					<title>YT downloader</title>
					<meta name="viewport" content="width=device-width, initial-scale=1.0">
					<style>
						body, html, input { font-family: sans-serif; font-size: 1rem; line-height: 1.75rem; }
						body { margin: 1em; }
						input { display: inline-block; background: white; color: black; border: 1px solid #ddd; border-radius: 4px; margin: 0 .5rem .5rem; padding: 0.25rem 0.5rem; }
						input[type="url"] { width: 30em; max-width: 90%; }
						input[type="submit"] {  background: #f4f4f4; }
						.error { color: red; }
					</style>
				</head>
				<body>
					${error ? '<p class="error">'+error+'</p>' : ''}
					${req.query.quality}
					<form method="get">
						<input name="url" type="url" placeholder="Paste Youtube URL here ..." value="${req.query.url ? escape(req.query.url) : ''}" />
						<input name="submit" type="submit" value="Download" />
						
						<br /><input type="radio" name="quality" value="highest" id="quality-highest" ${req.query.quality == 'highest' ? 'checked="checked"' : ''} /> <label for="quality-highest">Highest quality</label>

						<br /><input type="radio" name="quality" value="1080p" id="quality-1080p" ${req.query.quality == '1080p' ? 'checked="checked"' : ''} /> <label for="quality-1080p">1080p</label>

						<br /><input type="radio" name="quality" value="720p" id="quality-720p" ${req.query.quality == '720p' ? 'checked="checked"' : ''} /> <label for="quality-720p">720p</label>
						
						<br /><input type="radio" name="quality" value="480p" id="quality-480p" ${req.query.quality == '480p' ? 'checked="checked"' : ''} /> <label for="quality-480p">480p</label>
						
						<br /><input type="radio" name="quality" value="360p" id="quality-360p" ${req.query.quality == '360p' ? 'checked="checked"' : ''} /> <label for="quality-360p">360p</label>

						<br /><input type="radio" name="quality" value="240p" id="quality-240p" ${req.query.quality == '240p' ? 'checked="checked"' : ''} /> <label for="quality-240p">240p</label>
						
						<!--
						<br /><input type="radio" name="quality" value="lowest" id="quality-lowest" ${req.query.quality == 'lowest' ? 'checked="checked"' : ''} : ''}" /> <label for="quality-lowest">Lowest quality</label>
						-->
					</form>
				</body>
			</html>
		`);
		return;
	}

	console.log(videoId, 'Getting video');

	let options = {
		quality: 
		req.query.quality.match(/^(240|360|480|1080)p$/) ? req.query.quality : 'highest',
		filter: (format) => { 
			let matchingFormat = format.container === 'mp4';
			let matchingQuality = true;
			if (req.query.quality.match(/^[0-9]+p$/)) {
				matchingQuality = format.qualityLabel === req.query.quality;
			}
			if (matchingQuality && matchingFormat) {
				// console.log(`Matching format for ${videoId}: ${JSON.stringify(format, null, 2)}`);
			}
			return matchingQuality && matchingFormat;
		},
		format: req.query.format || undefined,
	};
	console.log(options)

	const stream = ytdl(req.query.url, options);

	stream.on('info', (info) => {
		// info.title;
		let name = 'yt-' + videoId;
		if (info.title) {
			name = slug(info.title);
		}
		res.setHeader('Content-disposition', `attachment; filename=${name}.mp4`);

		// console.log(videoId, 'info', info); 
		console.log(videoId, 'info', ', name=', name, ', info=', JSON.stringify(info, null, 2)); 
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