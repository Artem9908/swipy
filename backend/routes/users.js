// Update user online status
router.put('/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const { isOnline } = req.body;

    // Update user's online status in the database
    await User.findByIdAndUpdate(userId, {
      isOnline,
      lastSeen: isOnline ? new Date() : new Date()
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

// Get status for multiple users
router.post('/status', async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!Array.isArray(userIds)) {
      return res.status(400).json({ error: 'userIds must be an array' });
    }

    const users = await User.find(
      { _id: { $in: userIds } },
      { _id: 1, isOnline: 1, lastSeen: 1, lastSwipedAt: 1 }
    );

    // Format response
    const statusData = users.map(user => ({
      userId: user._id,
      isOnline: user.isOnline,
      lastSeen: user.lastSeen,
      lastSwipedAt: user.lastSwipedAt
    }));

    res.json(statusData);
  } catch (error) {
    console.error('Error fetching user statuses:', error);
    res.status(500).json({ error: 'Failed to fetch user statuses' });
  }
}); 