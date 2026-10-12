const router = require('express').Router();
const { socialLogin } = require('../services/socialSignupService');
const { configuration, verifyFacebookToken } = require('../services/facebookAuth');
router.get('/config', (req, res) => {
  const { enabled, appId, version } = configuration();
  res.json({ enabled, appId: enabled ? appId : '', version });
});
router.post('/', async (req, res) => {
  const profile = await verifyFacebookToken(req.body.accessToken);
  res.set('Cache-Control', 'no-store').json(await socialLogin('facebook', profile, req.body.role, req.body.rememberMe));
});
module.exports = router;
