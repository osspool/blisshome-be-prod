// src/models/Dashboard.js
import mongoose from 'mongoose';

const dashboardSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  totalOrders: { type: Number, default: 0 },
  totalRevenue: { type: Number, default: 0 },
  averageOrderValue: { type: Number, default: 0 },
  newOrders: { type: Number, default: 0 }, // Orders with status 'Pending'
  canceledOrders: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model('Dashboard', dashboardSchema);
