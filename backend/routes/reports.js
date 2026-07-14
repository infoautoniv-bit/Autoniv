import express from 'express';
import mongoose from 'mongoose';
import User from '../db/models/User.js';
import Agent from '../db/models/Agent.js';
import Call from '../db/models/Call.js';
import Lead from '../db/models/Lead.js';
import UserAddOn from '../db/models/UserAddOn.js';
import { authenticate } from '../middleware/auth.js';
import { generateMonthlyReport } from '../services/reportGenerator.js';
import { log } from '../services/logger.js';

const router = express.Router();
router.use(authenticate);

router.get('/performance-report', async (req, res) => {
  try {
    const userId = req.user.userId;
    const oid = new mongoose.Types.ObjectId(userId);

    const addon = await UserAddOn.findOne({
      userId: oid,
      addOnId: 'performance-report',
      status: 'approved',
    });

    if (!addon) {
      return res.status(403).json({
        message: 'You need an active Performance Report add-on to generate reports. Please request it from the Add-On Marketplace.',
      });
    }

    const now = new Date();
    let month = parseInt(req.query.month) || (now.getMonth() + 1);
    let year = parseInt(req.query.year) || now.getFullYear();

    if (month < 1) { month = 12; year--; }
    if (month > 12) { month = 1; year++; }

    log.info('generating_performance_report', { userId, month, year });

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const dbLookup = async (uid, m, y) => {
      const u = new mongoose.Types.ObjectId(uid);
      const [userDoc, agentDocs, callDocs, leadDocs] = await Promise.all([
        User.findById(u).lean(),
        Agent.find({ userId: u }).lean(),
        Call.find({ userId: u, createdAt: { $gte: startDate, $lte: endDate } }).lean(),
        Lead.find({ userId: u, createdAt: { $gte: startDate, $lte: endDate } }).lean(),
      ]);
      return { user: userDoc, agents: agentDocs, calls: callDocs, leads: leadDocs };
    };

    const pdfBuffer = await generateMonthlyReport(userId, month, year, { dbLookup });

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('Generated PDF is empty');
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Autoniv-Report-${monthNames[month - 1]}-${year}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });

    res.send(pdfBuffer);
  } catch (err) {
    log.error('generate_report_error', { error: err.message, userId: req.user?.userId });
    res.status(500).json({ message: `Failed to generate report: ${err.message}` });
  }
});

export default router;
