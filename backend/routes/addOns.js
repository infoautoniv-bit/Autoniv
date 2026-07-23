import express from 'express';
import UserAddOn from '../db/models/UserAddOn.js';
import AddOn from '../db/models/AddOn.js';
import User from '../db/models/User.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { requireValidObjectId } from '../middleware/validators.js';
import { contentFilter } from '../services/contentModeration.js';
import { log } from '../services/logger.js';
import { parsePage, paginatedResponse } from '../services/pagination.js';

const router = express.Router();
router.use(authenticate);

const FALLBACK_CATALOG = [
  { id: 'whatsapp-channel',   icon: '💬', title: 'WhatsApp Channel',   price: '₹2,499 / month', category: 'recurring', description: 'Native WhatsApp Business API with template support.', type: 'chat' },
  { id: 'advanced-analytics', icon: '📊', title: 'Advanced Analytics',  price: '₹1,499 / month', category: 'recurring', description: 'Funnel analysis, CSAT scores, and conversation heatmaps.', type: 'chat' },
  { id: 'priority-support',   icon: '🎧', title: 'Priority Support',   price: '₹4,999 / month', category: 'recurring', description: 'Dedicated Slack channel, 2-hour SLA, and onboarding specialist.', type: 'chat' },
  
  { id: 'monthly-performance-report', icon: '📊', title: 'Monthly Performance Report', price: '₹3,999–₹6,999 / month', category: 'recurring', description: 'Branded PDF with call quality scores, script performance, A/B outcomes, and industry benchmarks.', type: 'voice' },
  { id: 'script-ab-testing', icon: '🧪', title: 'Script A/B Testing', price: '₹8,999 / month', category: 'recurring', description: 'Run two scripts simultaneously. Analyze conversion rates and receive an optimized version monthly.', type: 'voice' },
  { id: 'whatsapp-followup', icon: '💬', title: 'WhatsApp Follow-Up Sequences', price: '₹4,999 / month', category: 'recurring', description: 'Automated post-call WhatsApp flows: reminders, no-show follow-ups, requalification messages.', type: 'voice' },
  { id: 'regional-language-agent', icon: '🌐', title: 'Regional Language Agent', price: '₹8,000 / month per language', category: 'recurring', description: 'Hindi, Tamil, Telugu, Bengali — reach Tier 2/3 city leads in their native language.', type: 'voice' },
  { id: 'reactivation-campaigns', icon: '🔁', title: 'Reactivation Campaigns', price: '₹14,999 / campaign', category: 'one-time', description: 'We call your dormant lead database quarterly. New pipeline with zero new ad spend.', type: 'voice' },
  { id: 'white-label-reseller', icon: '🏷️', title: 'White-Label Reseller', price: '₹49,999 setup + revenue share', category: 'one-time', description: 'Agencies and consultants: resell Autoniv under your brand with full support.', type: 'voice' }
];

let catalogCache = null;
let catalogCacheAt = 0;
const CACHE_TTL_MS = 60 * 1000;

async function getCatalog() {
  const now = Date.now();
  if (catalogCache && now - catalogCacheAt < CACHE_TTL_MS) return catalogCache;
  try {
    const rows = await AddOn.find({ active: true }).sort({ id: 1 }).lean();
    catalogCache = rows.length > 0 ? rows : FALLBACK_CATALOG;
  } catch (err) {
    log.warn('addon_catalog_fallback', { error: err.message });
    catalogCache = FALLBACK_CATALOG;
  }
  catalogCacheAt = now;
  return catalogCache;
}

router.get('/catalog', async (req, res) => {
  const addOns = await getCatalog();
  res.json({ addOns });
});

router.post('/catalog', requireAdmin, async (req, res) => {
  try {
    const { id, icon, title, price, category, description, type } = req.body;
    if (!id || !title || !price) {
      return res.status(400).json({ message: 'id, title, and price are required' });
    }
    const slug = id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const existing = await AddOn.findOne({ id: slug });
    if (existing) {
      return res.status(409).json({ message: 'An add-on with this ID already exists' });
    }
    const addOn = await AddOn.create({
      id: slug,
      icon: icon || '📦',
      title,
      price,
      category: category === 'one-time' ? 'one-time' : 'recurring',
      description: description || '',
      type: type === 'voice' ? 'voice' : 'chat',
      active: true,
    });
    catalogCache = null;
    log.info('catalog_addon_created', { id: slug, title, adminId: req.user?.userId });
    return res.status(201).json({ addOn });
  } catch (error) {
    log.error('create_catalog_addon_error', { error: error.message });
    return res.status(500).json({ message: 'Failed to create add-on' });
  }
});

router.get('/my', async (req, res) => {
  try {
    const { page, limit, skip } = parsePage(req.query);
    const catalog = await getCatalog();
    const filter = { userId: req.user.userId };
    const [items, total] = await Promise.all([
      UserAddOn.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      UserAddOn.countDocuments(filter),
    ]);
    const result = items.map((i) => ({
      ...i,
      id: i._id,
      addOn: catalog.find((a) => a.id === i.addOnId) || null,
    }));
    res.json(paginatedResponse({ items: result, total, page, limit }));
  } catch (error) {
    log.error('get_my_addons_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to fetch add-ons' });
  }
});

router.post('/', contentFilter('notes'), async (req, res) => {
  try {
    const { addOnId, notes } = req.body;
    const catalog = await getCatalog();
    const validIds = catalog.map((a) => a.id);
    if (!addOnId || !validIds.includes(addOnId)) {
      return res.status(400).json({ message: `addOnId must be one of: ${validIds.join(', ')}` });
    }
    const existing = await UserAddOn.findOne({
      userId: req.user.userId,
      addOnId,
      status: { $in: ['pending', 'approved'] },
    });
    if (existing) {
      return res.status(400).json({
        message: existing.status === 'pending'
          ? 'You already have a pending request for this add-on'
          : 'You already have this add-on active',
      });
    }
    const created = await UserAddOn.create({
      userId: req.user.userId,
      addOnId,
      notes: notes || null,
      status: 'pending',
    });
    res.status(201).json({
      userAddOn: {
        ...created.toObject(),
        id: created._id,
        addOn: catalog.find((a) => a.id === created.addOnId) || null,
      },
    });
  } catch (error) {
    log.error('request_addon_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to request add-on' });
  }
});

router.delete('/:id', requireValidObjectId('id'), async (req, res) => {
  try {
    const item = await UserAddOn.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Add-on request not found' });
    if (item.userId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (item.status !== 'pending') {
      return res.status(400).json({ message: `Cannot cancel a request that is ${item.status}` });
    }
    await UserAddOn.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    log.error('cancel_addon_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to cancel add-on request' });
  }
});

router.get('/', requireAdmin, async (req, res) => {
  try {
    const { page, limit, skip } = parsePage(req.query);
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const catalog = await getCatalog();
    const [items, total] = await Promise.all([
      UserAddOn.find(filter).populate('userId', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      UserAddOn.countDocuments(filter),
    ]);
    const result = items.map((i) => ({
      ...i,
      id: i._id,
      userName: i.userId?.name || null,
      userEmail: i.userId?.email || null,
      userId: i.userId?._id || i.userId,
      addOn: catalog.find((a) => a.id === i.addOnId) || null,
    }));
    res.json(paginatedResponse({ items: result, total, page, limit }));
  } catch (error) {
    log.error('get_all_addon_requests_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to fetch add-on requests' });
  }
});

router.put('/:id', requireValidObjectId('id'), requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status must be "approved" or "rejected"' });
    }
    const item = await UserAddOn.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Add-on request not found' });
    if (item.status !== 'pending') {
      return res.status(400).json({ message: `Request was already ${item.status}` });
    }
    item.status = status;
    await item.save();

    // Activate Add-On on user.activeAddOns array without altering plan tiers
    try {
      const user = await User.findById(item.userId);
      if (user) {
        user.activeAddOns = user.activeAddOns || [];
        if (status === 'approved') {
          if (!user.activeAddOns.includes(item.addOnId)) {
            user.activeAddOns.push(item.addOnId);
          }
        } else if (status === 'rejected') {
          user.activeAddOns = user.activeAddOns.filter(a => a !== item.addOnId);
        }
        await user.save();
        log.info('addon_status_updated_on_user', { userId: user._id, addOnId: item.addOnId, status });
      }
    } catch (actionErr) {
      log.error('addon_action_execution_error', { error: actionErr.message, addOnId: item.addOnId });
    }

    const catalog = await getCatalog();
    const updated = await UserAddOn.findById(item._id)
      .populate('userId', 'name email')
      .lean();
    res.json({
      userAddOn: {
        ...updated,
        id: updated._id,
        userName: updated.userId?.name || null,
        userEmail: updated.userId?.email || null,
        userId: updated.userId?._id || updated.userId,
        addOn: catalog.find((a) => a.id === updated.addOnId) || null,
      },
    });
  } catch (error) {
    log.error('process_addon_error', { error: error.message, userId: req.user?.userId });
    res.status(500).json({ message: 'Failed to process add-on request' });
  }
});

export default router;
export { FALLBACK_CATALOG, getCatalog };
