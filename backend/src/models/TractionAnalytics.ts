import mongoose, { Schema, Document } from 'mongoose';

export interface IDailyStat {
  date: string; // YYYY-MM-DD
  clicks: number;
  visitors: number;
  signups: number;
}

export interface ILiveEvent {
  id: string;
  type: 'visit' | 'click' | 'signup';
  text: string;
  time: string;
  createdAt: Date;
}

export interface ILiveVisitorDetail {
  visitorId: string;
  ip: string;
  location: string;
  isp: string;
  device: string;
  clicks: number;
  firstVisit: Date;
  lastVisit: Date;
}

export interface ITractionAnalytics extends Document {
  key: string; // 'singleton'
  baselineClicks: number;
  baselineVisitors: number;
  liveClicks: number;
  liveVisitors: number;
  visitorIds: string[]; // List of unique visitorIds to avoid double counting
  liveVisitorDetails: ILiveVisitorDetail[];
  dailyStats: IDailyStat[];
  recentEvents: ILiveEvent[];
  updatedAt: Date;
}

const DailyStatSchema = new Schema({
  date: { type: String, required: true },
  clicks: { type: Number, default: 0 },
  visitors: { type: Number, default: 0 },
  signups: { type: Number, default: 0 }
}, { _id: false });

const LiveEventSchema = new Schema({
  id: { type: String, required: true },
  type: { type: String, enum: ['visit', 'click', 'signup'], default: 'visit' },
  text: { type: String, required: true },
  time: { type: String, default: 'Vừa xong' },
  createdAt: { type: Date, default: Date.now }
}, { _id: false });

const LiveVisitorDetailSchema = new Schema({
  visitorId: { type: String, required: true },
  ip: { type: String, default: '42.112.89.201' },
  location: { type: String, default: 'Đà Nẵng (Thiết bị vừa truy cập)' },
  isp: { type: String, default: 'FPT Telecom' },
  device: { type: String, default: 'Windows 11 / Chrome' },
  clicks: { type: Number, default: 1 },
  firstVisit: { type: Date, default: Date.now },
  lastVisit: { type: Date, default: Date.now }
}, { _id: false });

const TractionAnalyticsSchema = new Schema({
  key: { type: String, default: 'singleton', unique: true },
  baselineClicks: { type: Number, default: 415 },
  baselineVisitors: { type: Number, default: 184 },
  liveClicks: { type: Number, default: 0 },
  liveVisitors: { type: Number, default: 0 },
  visitorIds: { type: [String], default: [] },
  liveVisitorDetails: { type: [LiveVisitorDetailSchema], default: [] },
  dailyStats: { type: [DailyStatSchema], default: [] },
  recentEvents: { type: [LiveEventSchema], default: [] }
}, { timestamps: true });

export default mongoose.model<ITractionAnalytics>('TractionAnalytics', TractionAnalyticsSchema);

