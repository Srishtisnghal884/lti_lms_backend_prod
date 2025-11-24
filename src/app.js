const express = require('express');
const helmet = require('helmet');
const xss = require('xss-clean');
const compression = require('compression');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const httpStatus = require('http-status');
const { postgres } = require('./config/postgres');
const config = require('./config/config');
const morgan = require('./config/morgan');
const jwt = require('./config/jwt');
const { authLimiter } = require('./middlewares/rateLimiter');
const routes = require('./routes/v1');
const { errorConverter, errorHandler } = require('./middlewares/error');
const ApiError = require('./utils/ApiError');
const crypto = require("crypto");

const app = express();

if (config.env !== 'test') {
	app.use(morgan.successHandler);
	app.use(morgan.errorHandler);
}

// set security HTTP headers
// app.use((req, res, next) => {
//   res.locals.nonce = crypto.randomBytes(16).toString("base64");
//   next();
// });

// app.use(
//   helmet({
//     contentSecurityPolicy: {
//       directives: {
//         defaultSrc: ["'self'"],
//         scriptSrc: [
//           "'self'",
//           "'unsafe-hashes'",
//           "'sha256-6cBEYZKqskvYN6JIr/w8nPN3eoRwntwXWG85yGcoA1Q='"
//         ],
//         frameAncestors: [
//           "'self'",
//           "https://www.openlearning.com",
//           "https://*.openlearning.com"
//         ],
//         formAction: ["'self'", "https://www.openlearning.com"]
//       }
//     }
//   })
// );


// parse json request body
app.use(express.json());

// parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// sanitize request data
app.use(xss());

// gzip compression
app.use(compression());

// enable cors
app.use(cors());
app.options('*', cors());

app.use(cookieParser());

app.use('/public', express.static('public'))



// jwt authentication
// app.use(jwt());
app.use(
  jwt({ secret: process.env.JWT_SECRET, algorithms: ['HS256'] }).unless({
    path: ['/v1/docs'], // adjust path according to your router prefix
  })
);

// connect to postgres database
app.use((req, _, next) => {
	req.postgres = postgres;
	next();
});

// limit repeated failed requests to auth endpoints
if (config.env === 'production') {
	app.use('/v1/auth', authLimiter);
}

// v1 api routes
app.use('/v1', routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
	next(new ApiError(httpStatus.NOT_FOUND, 'Not found'));
});

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

module.exports = app;
