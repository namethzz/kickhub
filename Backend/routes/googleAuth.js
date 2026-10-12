const router = require('express').Router();
const { socialLogin } = require('../services/socialSignupService');
const { configuration, verifyGoogleToken } = require('../services/googleAuth');
router.get('/config', (req, res) => {
  const { enabled, clientId } = configuration();
  res.json({ enabled, clientId: enabled ? clientId : '' });
});
router.post('/', async (req, res) => {
  const profile = await verifyGoogleToken(req.body.credential);
  res.set('Cache-Control', 'no-store').json(await socialLogin('google', profile, req.body.role, req.body.rememberMe));
});
module.exports = router;
