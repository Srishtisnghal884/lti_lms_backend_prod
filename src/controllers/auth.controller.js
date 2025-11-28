const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const crypto = require("crypto");
const fs = require("fs");
const jwt = require('jsonwebtoken');
const  jwksClient = require('jwks-rsa');

const {
	authService,
	userService,
	emailService,
	tokenService,
} = require('../services');
const { verifyToken } = require('../utils/auth');

const register = catchAsync(async (req, res) => {
	const user = await userService.createUser(req);
	const tokens = await tokenService.generateAuthTokens({
		userId: user.id,
		roleId: user.role_id,
	});
	delete user.password;
	res.status(httpStatus.CREATED).send({ user, tokens });
});

const login = catchAsync(async (req, res) => {
	const user = await authService.loginUserWithEmailAndPassword(req);
	console.log({user});
	const tokens = await tokenService.generateAuthTokens({
		userId: user.id,
		roleId: user.role_id,
	});
	res.send({ user, tokens });
});

const forgotPassword = catchAsync(async (req, res) => {
	const resetPasswordToken = await tokenService.generateResetPasswordToken(
		req.body.email
	);
	await emailService.sendResetPasswordEmail(
		req.body.email,
		resetPasswordToken
	);
	res.send({ success: true });
});

const resetPassword = catchAsync(async (req, res) => {
	const { id } = await verifyToken(req.query.token);
	req.body.id = id;
	await userService.updateUser(req);
	res.send({ success: true });
});

// SSO Openlearning Configuration
const ltiLogin = catchAsync(async (req, res) => {
		const {
			iss,                // platform issuer
			login_hint,         // hint for the LMS login
			lti_message_hint,   // hint about which resource/course
			target_link_uri     // should point to your launch URL
		} = req.query;
		
		if (!iss || !login_hint) {
			return res.status(400).send("Missing required OIDC parameters (iss or login_hint)");
		}
		// Build redirect to OpenLearning’s OIDC authorization endpoint
		const authUrl = new URL(process.env.AUTH_URL);
		authUrl.searchParams.append('scope', 'openid');
		authUrl.searchParams.append('response_type', 'id_token');
		authUrl.searchParams.append('response_mode', 'form_post');
		authUrl.searchParams.append('prompt', 'none');
		authUrl.searchParams.append('client_id', process.env.CLIENT_ID);
		authUrl.searchParams.append('redirect_uri', process.env.TOOL_LAUNCH_URL);
		authUrl.searchParams.append('login_hint', login_hint);
		if (lti_message_hint) authUrl.searchParams.append('lti_message_hint', lti_message_hint);
		if (target_link_uri) authUrl.searchParams.append('target_link_uri', target_link_uri);
		authUrl.searchParams.append('state', Math.random().toString(36).substring(7)); // optional nonce
		authUrl.searchParams.append('nonce', Math.random().toString(36).substring(7)); // optional nonce
		authUrl.searchParams.append('iss', iss);
		res.redirect(authUrl.toString());		
});

const ltiLaunch = catchAsync(async (req, res) => {
  const idToken = req.body.id_token;
  if (!idToken) return res.status(400).send('Missing id_token');
  const decoded = jwt.decode(idToken, { complete: true });
  const client = jwksClient({ jwksUri: process.env.KEYSET_URL });
  const key = await client.getSigningKey(decoded.header.kid);
  const signingKey = key.getPublicKey();
  const verified = jwt.verify(idToken, signingKey, {
      audience: process.env.CLIENT_ID,
      issuer: process.env.ISSUER,
      algorithms: ['RS256']
    });
  try {
      const msgType = verified["https://purl.imsglobal.org/spec/lti/claim/message_type"];
      if (msgType === "LtiDeepLinkingRequest") {
        const deepLinkSettings =
          verified["https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings"];
        const returnUrl = deepLinkSettings.deep_link_return_url;
        // Build a Deep Linking Response JWT
        const now = Math.floor(Date.now() / 1000);
        const responsePayload = {
          iss: process.env.CLIENT_ID,              // your tool
          aud: process.env.ISSUER,                 // OpenLearning issuer
          iat: now,
          exp: now + 5 * 60,
          nonce: crypto.randomUUID(),
          "https://purl.imsglobal.org/spec/lti/claim/message_type": "LtiDeepLinkingResponse",
          "https://purl.imsglobal.org/spec/lti/claim/version": "1.3.0",
          "https://purl.imsglobal.org/spec/lti-dl/claim/content_items": [
            {
              type: "ltiResourceLink",
              title: "My LTI Tool Activity",
              url: process.env.TOOL_LAUNCH_URL,
              // presentation: { documentTarget: "iframe" },
              presentation: {
                documentTarget: "iframe",
                height: 600,          // Height in pixels
                width: 800            // optional
              },
              custom: {
                mode: "student",      // optional, you can pass any config
              },
            },
          ],
        };
        // sign with your private key
				const privateKey = process.env.PRIVATE_KEY.replace(/\\n/g, '\n');
				// const privateKey = fs.readFileSync("./src/keys/private.key"); // use the same private key whose public part is in your JWKS
        const deepLinkJwt = jwt.sign(responsePayload, privateKey, {
          algorithm: "RS256",
          keyid: "my-key-1", // must match your JWKS `kid`
        });
        // Redirect back to OL with the signed JWT
        const redirectUrl = `${returnUrl}?JWT=${deepLinkJwt}`;
         // Normal LTI launch for students
				res.send(`
					<html>  
						<body onload="document.forms[0].submit()">
									<form action="${returnUrl}" method="POST">
										<input type="hidden" name="JWT" value="${deepLinkJwt}" />
								</form>
								<h1>Welcome ${verified.name}! </h1>
						</body>
					</html>
					`);
      }

     if (msgType === "LtiResourceLinkRequest") {
        const userName = verified.name;
        const userEmail = verified.email;
        const userId = verified.sub;
        // Create your own short-lived JWT for your system
        const appJwt = jwt.sign(
          { email: userEmail, name: userName, ltiUserId: userId },
          process.env.JWT_SECRET,
          { expiresIn: "5m" }
        );
        // Redirect to your main system with the token
        const appLaunchUrl = `${process.env.MY_APP_URL}/lti/sso-login?token=${appJwt}`;
				return res.redirect(appLaunchUrl);
      }
  } catch (err) {
    console.error('JWT Verification failed:', err);
    res.status(401).send('Invalid LTI launch');
  }

});

const jwks = catchAsync(async (req, res) => {
	console.log({'process key public--->':process.env.PUBLIC_KEY})
		// const publicKey = fs.readFileSync('./src/keys/public.pem', 'utf8');
		const publicKey = process.env.PUBLIC_KEY.replace(/\\n/g, '\n');
		
		const key = crypto.createPublicKey(publicKey).export({ format: 'jwk' });
		/*console.log('JWKS:', {
			kty: key.kty,
			kid: 'my-key-1',
			alg: 'RS256',
			use: 'sig',
			n: key.n,
			e: key.e,
		});*/
	res.json({
			keys: [
				{
					kty: key.kty,
					kid: 'my-key-1',
					alg: 'RS256',
					use: 'sig',
					n: key.n,
					e: key.e,
				}]
		});
});

const ltiSsoLogin = catchAsync(async (req, res) => {
  try {
    const { token } = req.query;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { email, name , ltiUserId } = decoded;
    // ✅ Now req.session is defined
   // req.session.user = { email, name };
    //console.log("SSO user session created:", req.session.user);
    const userToken = jwt.sign({ email, name }, process.env.JWT_SECRET, { expiresIn: "5h" });
		// res.send(`
    //   <h2>Welcome ${name}</h2>
    //   <p>Email: ${email}</p>
		// 	<a class="css-1yo9745 ew0ppij0" style="
		// 			border: 1px solid rgb(9, 73, 103);
		// 			cursor: pointer;
		// 			display: inline-block;
		// 			font-style: normal;
		// 			outline: none;
		// 			font-family: inherit;
		// 			font-weight: 500;
		// 			font-size: 16px;
		// 			line-height: 20px;
		// 			border-radius: 4px;
		// 			padding: 12px 20px;
		// 			background: rgb(9, 73, 103);
		// 			color: rgb(255, 255, 255);
		// 	" target="_blank" href=${`https://lti-lms.vercel.app/?auth=${userToken}`}>Launch</a>
    // `);
		// const redirectUrl = `https://lti-lms.vercel.app/?auth=${userToken}`;
		// return res.redirect(redirectUrl);

		// res.send(`
		// 		<html>
		// 			<body>
		// 				<script>
		// 					window.open("https://lti-lms.vercel.app/?auth=${userToken}", "_blank");
		// 					window.location.href = "/somewhere-else";  // optional
		// 				</script>
		// 			</body>
		// 		</html>
		// `);

		res.send(`
			<html>
				<body>
					<button id="openWindow">Continue</button>

					<script>
						document.getElementById("openWindow").addEventListener("click", () => {
							const url = "https://lti-lms.vercel.app/?auth=${userToken}";
							window.open(url, "_blank");
							window.close();
						});
					</script>
				</body>
			</html>
		`);

  } catch (err) {
    console.error("SSO login failed:", err);
    res.status(401).send("Invalid or expired SSO token");
  }
});

const ltiDashboard = catchAsync(async (req, res) => {
	const { auth } = req.query;
  try {
    const decoded = jwt.verify(auth, process.env.JWT_SECRET);
    const { email, name ,ltiUserId } = decoded;
    // console.log({decoded});
    // res.send(`
    //   <h2>Welcome ${name}</h2>
    //   <p>Email: ${email}</p>
    //   <p>You're logged in via JWT SSO From backend</p>
    // `);

		
		// get logo here
		const getLogo = await userService.getUserLogoByEmail('admin@gmail.com');
		const user = {
			name:name,
			email:email,
			logo:getLogo?.logo || 'https://employabilityadvantage.com/wp-content/uploads/2023/01/ECA-coloured-logo.svg'
		}
		const tokens = await tokenService.generateAuthTokens({
			userId: ltiUserId,
			roleId: 3, // for student
		});
		res.send({ user, tokens });
		
  } catch (err) {
    res.status(401).send({
					code : 401,
					message:"Invalid or expired login token"
				}
			);
  }
});


module.exports = {
	register,
	login,
	forgotPassword,
	resetPassword,
	ltiLogin,
	ltiLaunch,
	jwks,
	ltiDashboard,
	ltiSsoLogin
};
