import express from 'express';
import User from '../db/models/User.js';
import Agent from '../db/models/Agent.js';
import Call from '../db/models/Call.js';
import Lead from '../db/models/Lead.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { log } from '../services/logger.js';

const router = express.Router();
router.use(authenticate);

router.get('/overview', requireAdmin, async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0); // Fix: timezone-safe start-of-day

    const [totalUsers, activeAgents, totalAgents, callsToday, totalMinutesResult] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Agent.countDocuments({ isActive: true }),
      Agent.countDocuments(),
      Call.countDocuments({
        startedAt: { $gte: startOfToday },
      }),
      User.aggregate([{ $group: { _id: null, total: { $sum: '$minutesUsed' } } }]),
    ]);

    res.json({
      totalUsers,
      activeAgents,
      inactiveAgents: totalAgents - activeAgents,
      totalAgents,
      callsToday,
      totalMinutes: Math.round(totalMinutesResult[0]?.total || 0),
    });
  } catch (error) {
    log.error('analytics_overview_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to fetch overview' });
  }
});

router.get('/my-stats', async (req, res) => {
  try {
    const userId = req.user.userId;

    const [agentCount, callCount, calls, leadCount] = await Promise.all([
      Agent.countDocuments({ userId }),
      Call.countDocuments({ userId }),
      Call.find({
        userId,
        status: 'completed',
        endedAt: { $ne: null },
        startedAt: { $ne: null },
      }).lean(),
      Lead.countDocuments({ userId }),
    ]);

    const minutesUsed = calls.reduce((sum, c) => { // Fix: renamed minuteUsed → minutesUsed
      let seconds = 0;
      if (typeof c.duration === 'number' && c.duration > 0) {
        seconds = c.duration;
      } else if (c.endedAt && c.startedAt) {
        seconds = Math.max(0, (new Date(c.endedAt).getTime() - new Date(c.startedAt).getTime()) / 1000);
      }
      return sum + Math.floor(seconds / 60);
    }, 0);

    res.json({ agentCount, callCount, minutesUsed, leadCount });
  } catch (error) {
    log.error('my_stats_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
});

router.get('/usage', requireAdmin, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    let days = 30;
    if (period === '7d') days = 7;
    if (period === '90d') days = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const usage = await User.aggregate([
      { $match: { role: 'user' } },
      {
        $lookup: {
          from: 'calls',
          let: { userId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$userId', '$$userId'] },
                $or: [
                  { startedAt: { $gte: startDate } },
                  { endedAt:   { $gte: startDate } },
                  { createdAt: { $gte: startDate } },
                ],
              },
            },
          ],
          as: 'calls',
        },
      },
      {
        $addFields: {
          _callsWithDuration: {
            $map: {
              input: '$calls',
              as: 'c',
              in: {
                $cond: [
                  { $gt: ['$$c.duration', 0] },
                  '$$c.duration',
                  {
                    $divide: [
                      {
                        $max: [
                          0,
                          {
                            $subtract: [
                              { $ifNull: ['$$c.endedAt', '$$c.startedAt'] },
                              { $ifNull: ['$$c.startedAt', '$$c.endedAt'] },
                            ],
                          },
                        ],
                      },
                      1000,
                    ],
                  },
                ],
              },
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          plan: 1,
          minutesUsed: 1,
          minutesLimit: 1,
          callCount: { $size: '$calls' },
          calcMinutes: {
            $round: [
              { $divide: [{ $sum: '$_callsWithDuration' }, 60] },
              0,
            ],
          },
        },
      },
      { $sort: { calcMinutes: -1 } },
    ]);

    res.json({ usage });
  } catch (error) {
    log.error('usage_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to fetch usage' });
  }
});

router.get('/trends', requireAdmin, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    let days = 30;
    if (period === '7d') days = 7;
    if (period === '90d') days = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trends = await Call.aggregate([
      {
        $match: {
          $or: [
            { startedAt: { $gte: startDate } },
            { endedAt:   { $gte: startDate } },
            { createdAt: { $gte: startDate } },
          ],
        },
      },
      {
        $addFields: {
          effectiveDuration: {
            $cond: [
              { $gt: ['$duration', 0] },
              '$duration',
              {
                $divide: [
                  {
                    $max: [
                      0,
                      {
                        $subtract: [
                          { $ifNull: ['$endedAt', '$startedAt'] },
                          { $ifNull: ['$startedAt', '$endedAt'] },
                        ],
                      },
                    ],
                  },
                  1000,
                ],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: { $ifNull: ['$startedAt', { $ifNull: ['$endedAt', '$createdAt'] }] },
            },
          },
          calls: { $sum: 1 },
          totalDuration: { $sum: '$effectiveDuration' }, // Fix: accumulate raw, round after $group
        },
      },
      { $sort: { _id: 1 } },
      {
        $project: {
          _id: 0,
          date: '$_id',
          calls: 1,
          minutes: { $round: [{ $divide: ['$totalDuration', 60] }, 0] }, // Fix: $round moved to $project
        },
      },
    ]);

    res.json({ trends });
  } catch (error) {
    log.error('trends_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to fetch trends' });
  }
});

router.get('/period-overview', requireAdmin, async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    let days = 30;
    if (period === '7d') days = 7;
    if (period === '90d') days = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalUsers, totalAgents, activeAgents, periodStats] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Agent.countDocuments(),
      Agent.countDocuments({ isActive: true }),
      Call.aggregate([
        {
          $match: {
            $or: [
              { startedAt: { $gte: startDate } },
              { endedAt:   { $gte: startDate } },
              { createdAt: { $gte: startDate } },
            ],
          },
        },
        {
          $addFields: {
            effectiveDuration: {
              $cond: [
                { $gt: ['$duration', 0] },
                '$duration',
                {
                  $divide: [
                    {
                      $max: [
                        0,
                        {
                          $subtract: [
                            { $ifNull: ['$endedAt', '$startedAt'] },
                            { $ifNull: ['$startedAt', '$endedAt'] },
                          ],
                        },
                      ],
                    },
                    1000,
                  ],
                },
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            totalDuration: { $sum: '$effectiveDuration' }, // Fix: accumulate raw, round after $group
            totalCalls: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            totalMinutes: { $round: [{ $divide: ['$totalDuration', 60] }, 0] }, // Fix: $round moved to $project
            totalCalls: 1,
          },
        },
      ]),
    ]);

    res.json({
      totalUsers,
      activeAgents,
      inactiveAgents: totalAgents - activeAgents,
      totalAgents,
      totalMinutes: Math.round(periodStats[0]?.totalMinutes || 0),
      totalCalls: periodStats[0]?.totalCalls || 0,
    });
  } catch (error) {
    log.error('period_overview_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to fetch period overview' });
  }
});

export default router;