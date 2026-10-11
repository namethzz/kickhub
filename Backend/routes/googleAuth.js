const router = require('express').Router();
const jwt = require('jsonwebtoken');
const { configuration, verifyGoogleToken, googleAccount } = require('../services/googleAuth');
router.get('/config', (req, res) => {
  const { enabled, clientId } = configuration();
  res.json({ enabled, clientId: enabled ? clientId : '' });
});
router.post('/', async (req, res) => {
  const profile = await verifyGoogleToken(req.body.credential);
  const user = await googleAccount(profile, req.body.role || 'user');
  const token = jwt.sign({ _id: user._id }, process.env.SECRET_KEY, { expiresIn: req.body.rememberMe === true ? '7d' : '24h' });
  res.json({ status: 'ok', token });
});
module.exports = router;
