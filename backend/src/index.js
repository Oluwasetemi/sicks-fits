// let's go!
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'variables.env' });
const createServer = require('./createServer');
const db = require('./db');

const server = createServer();

// TODO: Use express middleware to handle cookies (JWT)
server.express.use(cookieParser());
// TODO: Use express middleware to populate current user (JWT)
server.express.use((req, res, next) => {
	const { token } = req.cookies;

	if (token) {
		const { userId } = jwt.verify(token, process.env.APP_SECRET);
		req.userId = userId;
	}
	next();
});

// 2. create a middleware that populates the user in the request
server.express.use(async (req, res, next) => {
	// if they aren't logged in, skip this
	if (!req.userId) return next();
	const user = await db.query.user(
		{
			where: { id: req.userId },
		},
		'{ id, permissions, email, name }',
	);
	req.user = user;
	next();
});

server.start(
	{
		cors: {
			credentials: true,
			origin: process.env.FRONTEND_URL,
		},
	},
	deets => {
		console.log(
			`Server is now running on port http://localhost:${process.env.PORT ||
				deets.port}`,
		);
	},
);
