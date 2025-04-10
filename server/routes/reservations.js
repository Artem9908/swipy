const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');

router.post('/', async (req, res) => {
  try {
    const reservation = new Reservation(req.body);
    await reservation.save();
    res.json(reservation);
  } catch(e) {
    res.status(400).json({ error: e.message });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.params.userId });
    res.json(reservations);
  } catch(e) {
    res.status(400).json({ error: e.message });
  }
});

module.exports = router;