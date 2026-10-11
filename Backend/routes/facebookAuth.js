const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { configuration, verifyFacebookToken, facebookAccount } = require('../services/facebookAuth');
router.get('/config', (req, res) => {
  const { enabled, appId, version } = configuration();
  res.json({ enabled, appId: enabled ? appId : '', version });
});
router.post('/', async (req, res) => {
  const profile = await verifyFacebookToken(req.body.accessToken);
  const user = await facebookAccount(profile, req.body.role || 'user');
  const token = jwt.sign({ _id: user._id }, process.env.SECRET_KEY, { expiresIn: req.body.rememberMe === true ? '7d' : '24h' });
  res.json({ status: 'ok', token });
});
module.exports = router;
