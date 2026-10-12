const router = require('express').Router();
const { completeSocialSignup } = require('../services/socialSignupService');
router.post('/complete', async (req, res) => {
  res.set('Cache-Control', 'no-store').json(await completeSocialSignup(req.body.signupToken, req.body.role, req.body.rememberMe));
});
module.exports = router;
