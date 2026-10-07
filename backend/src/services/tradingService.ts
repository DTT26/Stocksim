import mongoose from 'mongoose';
import Wallet from '../models/Wallet';
import Holding from '../models/Holding';
import Order, { OrderSide, OrderType, OrderStatus } from '../models/Order';
import Transaction, { TransactionType } from '../models/Transaction';
import Challenge from '../models/Challenge';
import { WalletService } from './walletService';
import { CHALLENGE_LEVELS } from './challengeService';
import { createNotification } from '../controllers/notificationController';

export class TradingService {
  static async getOrCreateWallet(userId: string) {
    return WalletService.getOrCreateWallet(userId);
  }

  /**
   * Xác định ngữ cảnh tài khoản đang giao dịch:
   * - Nếu User đang có bài thi Cấp Vốn 'ACTIVE' hoặc 'PAUSED' -> Dùng Tài khoản Bài Thi (CHALLENGE)
   * - Nếu User không trong bài thi ('NOT_STARTED', 'PASSED', 'FAILED') -> Dùng Tài khoản Thường (STANDARD)
   * => TÁCH BIỆT HOÀN TOÀN: Tiền bài thi không ảnh hưởng ví thường, kết thúc bài thi ví thường giữ nguyên 100%.
   */
  private static async getActiveContext(userId: string) {
    const challenge = await Challenge.findOne({
      userId,
      status: { $in: ['ACTIVE', 'PAUSED', 'FAILED', 'PASSED'] }
    });

    if (challenge) {
      return {
        isChallenge: true,
        accountType: 'CHALLENGE' as const,
        challenge,
        balance: challenge.currentBalanceUSD,
        availableBalance: challenge.currentBalanceUSD,
        deductBalance: async (amount: number) => {
          challenge.currentBalanceUSD = Math.max(0, challenge.currentBalanceUSD - amount);
          await challenge.save();
        },
        addBalance: async (amount: number) => {
          challenge.currentBalanceUSD += amount;
          await challenge.save();
        }
      };
    }

    const wallet = await WalletService.getOrCreateWallet(userId);
    return {
      isChallenge: false,
      accountType: 'STANDARD' as const,
      wallet,
      balance: wallet.balance,
      availableBalance: wallet.availableBalance,
      deductBalance: async (amount: number) => {
        wallet.balance -= amount;
        wallet.availableBalance -= amount;
        await wallet.save();
      },
      addBalance: async (amount: number) => {
        wallet.balance += amount;
        wallet.availableBalance += amount;
        await wallet.save();
      }
    };
  }

  /**
   * 1. MỞ VỊ THẾ LONG (Cược giá lên)
   */
  static async openLong(userId: string, symbol: string, margin: number, leverage: number, currentPrice: number, stopLoss?: number, takeProfit?: number) {
    if (margin <= 0) throw new Error("Ký quỹ (Margin) phải lớn hơn 0");
    if (leverage < 1 || leverage > 500) throw new Error("Đòn bẩy không hợp lệ");

    const ctx = await this.getActiveContext(userId);
    if (ctx.isChallenge && ctx.challenge) {
      if (ctx.challenge.status === 'FAILED') {
        throw new Error('Bài thi đã bị vi phạm. Vui lòng reset bài thi hoặc hủy thi để tiếp tục.');
      }
      if (ctx.challenge.status === 'PAUSED') {
        throw new Error('Bài thi đang tạm dừng. Vui lòng bấm Tiếp Tục bài thi để mở lệnh.');
      }
      if (ctx.challenge.status === 'PASSED') {
        throw new Error('Bài thi đã hoàn thành xuất sắc! Vui lòng nâng cấp độ tiếp theo.');
      }
      const levelConfig = CHALLENGE_LEVELS.find(l => l.id === ctx.challenge?.currentLevel) || CHALLENGE_LEVELS[0];
      if (leverage > levelConfig.maxLeverage) {
        throw new Error(`Đòn bẩy tối đa cho bài thi Cấp ${levelConfig.id} (${levelConfig.levelName}) là ${levelConfig.maxLeverage}X`);
      }
    }

    const marginRequired = margin;
    const quantity = (margin * leverage) / currentPrice;

    if (ctx.availableBalance < marginRequired) {
      throw new Error(`Ký quỹ không đủ. Số dư khả dụng hiện tại: $${ctx.availableBalance.toLocaleString('en-US')}`);
    }

    // Kiểm tra xem đã có lệnh SHORT ngược chiều chưa (One-way mode đơn giản) trong cùng loại tài khoản
    const existingShort = await Holding.findOne({ userId, symbol, side: 'SHORT', accountType: ctx.accountType });
    if (existingShort) throw new Error("Vui lòng đóng vị thế SHORT trước khi mở LONG");

    await ctx.deductBalance(marginRequired);

    let holding = await Holding.findOne({ userId, symbol, side: 'LONG', accountType: ctx.accountType });
    if (holding) {
      const totalValueOld = holding.quantity * holding.averagePrice;
      const totalValueNew = quantity * currentPrice;
      holding.quantity += quantity;
      holding.averagePrice = (totalValueOld + totalValueNew) / holding.quantity;
      holding.leverage = leverage;
      if (takeProfit) holding.tp = takeProfit;
      if (stopLoss) holding.sl = stopLoss;
      await holding.save();
    } else {
      await Holding.create({
        userId,
        symbol,
        side: 'LONG',
        quantity,
        averagePrice: currentPrice,
        leverage,
        tp: takeProfit,
        sl: stopLoss,
        accountType: ctx.accountType
      });
    }

    const order = await Order.create({
      userId,
      symbol,
      side: OrderSide.LONG,
      type: OrderType.MARKET,
      quantity,
      price: currentPrice,
      margin: marginRequired,
      leverage,
      stopLoss,
      takeProfit,
      status: OrderStatus.FILLED,
      accountType: ctx.accountType
    });

    await Transaction.create({
      userId,
      orderId: order._id,
      type: TransactionType.BUY_STOCK,
      amount: -marginRequired,
      accountType: ctx.accountType,
      description: `Mở LONG ${symbol} ở giá ${currentPrice >= 100 ? currentPrice.toLocaleString('vi-VN') : currentPrice.toFixed(2)} | Margin: ${marginRequired >= 100 ? marginRequired.toLocaleString('vi-VN') : marginRequired.toFixed(2)} | x${leverage} | Qty: ${quantity.toFixed(4)}`,
      metadata: {
        symbol,
        side: 'LONG',
        entryPrice: currentPrice,
        quantity,
        leverage,
        margin: marginRequired,
        stopLoss,
        takeProfit,
        isOpen: true
      }
    });

    return {
      success: true,
      message: `Mở LONG ${symbol} thành công (x${leverage}) [${ctx.isChallenge ? 'Tài khoản Thi' : 'Tài khoản Thường'}]`
    };
  }

  /**
   * 2. MỞ VỊ THẾ SHORT (Cược giá xuống)
   */
  static async openShort(userId: string, symbol: string, margin: number, leverage: number, currentPrice: number, stopLoss?: number, takeProfit?: number) {
    if (margin <= 0) throw new Error("Ký quỹ (Margin) phải lớn hơn 0");
    if (leverage < 1 || leverage > 500) throw new Error("Đòn bẩy không hợp lệ");

    const marginRequired = margin;
    const quantity = (margin * leverage) / currentPrice;

    const ctx = await this.getActiveContext(userId);
    if (ctx.isChallenge && ctx.challenge) {
      if (ctx.challenge.status === 'FAILED') {
        throw new Error('Bài thi đã bị vi phạm. Vui lòng reset bài thi hoặc hủy thi để tiếp tục.');
      }
      if (ctx.challenge.status === 'PAUSED') {
        throw new Error('Bài thi đang tạm dừng. Vui lòng bấm Tiếp Tục bài thi để mở lệnh.');
      }
      if (ctx.challenge.status === 'PASSED') {
        throw new Error('Bài thi đã hoàn thành xuất sắc! Vui lòng nâng cấp độ tiếp theo.');
      }
      const levelConfig = CHALLENGE_LEVELS.find(l => l.id === ctx.challenge?.currentLevel) || CHALLENGE_LEVELS[0];
      if (leverage > levelConfig.maxLeverage) {
        throw new Error(`Đòn bẩy tối đa cho bài thi Cấp ${levelConfig.id} (${levelConfig.levelName}) là ${levelConfig.maxLeverage}X`);
      }
    }

    if (ctx.availableBalance < marginRequired) {
      throw new Error(`Ký quỹ không đủ. Số dư khả dụng hiện tại: $${ctx.availableBalance.toLocaleString('en-US')}`);
    }

    const existingLong = await Holding.findOne({ userId, symbol, side: 'LONG', accountType: ctx.accountType });
    if (existingLong) throw new Error("Vui lòng đóng vị thế LONG trước khi mở SHORT");

    await ctx.deductBalance(marginRequired);

    let holding = await Holding.findOne({ userId, symbol, side: 'SHORT', accountType: ctx.accountType });
    if (holding) {
      const totalValueOld = holding.quantity * holding.averagePrice;
      const totalValueNew = quantity * currentPrice;
      holding.quantity += quantity;
      holding.averagePrice = (totalValueOld + totalValueNew) / holding.quantity;
      holding.leverage = leverage;
      if (takeProfit) holding.tp = takeProfit;
      if (stopLoss) holding.sl = stopLoss;
      await holding.save();
    } else {
      await Holding.create({
        userId,
        symbol,
        side: 'SHORT',
        quantity,
        averagePrice: currentPrice,
        leverage,
        tp: takeProfit,
        sl: stopLoss,
        accountType: ctx.accountType
      });
    }

    const order = await Order.create({
      userId,
      symbol,
      side: OrderSide.SHORT,
      type: OrderType.MARKET,
      quantity,
      price: currentPrice,
      margin: marginRequired,
      leverage,
      stopLoss,
      takeProfit,
      status: OrderStatus.FILLED,
      accountType: ctx.accountType
    });

    await Transaction.create({
      userId,
      type: TransactionType.SELL_STOCK,
      amount: -marginRequired,
      accountType: ctx.accountType,
      description: `Mở SHORT ${symbol} ở giá ${currentPrice >= 100 ? currentPrice.toLocaleString('vi-VN') : currentPrice.toFixed(2)} | Margin: ${marginRequired >= 100 ? marginRequired.toLocaleString('vi-VN') : marginRequired.toFixed(2)} | x${leverage} | Qty: ${quantity.toFixed(4)}`,
      metadata: {
        symbol,
        side: 'SHORT',
        entryPrice: currentPrice,
        quantity,
        leverage,
        margin: marginRequired,
        stopLoss,
        takeProfit,
        isOpen: true
      }
    });

    return {
      success: true,
      message: `Mở SHORT ${symbol} thành công (x${leverage}) [${ctx.isChallenge ? 'Tài khoản Thi' : 'Tài khoản Thường'}]`
    };
  }

  /**
   * 3. ĐÓNG VỊ THẾ (Chốt lời/Lỗ) - Hỗ trợ Đóng toàn bộ hoặc Đóng một phần (Partial Close)
   */
  static async closePosition(userId: string, symbol: string, side: 'LONG'|'SHORT', currentPrice: number, closeQty?: number) {
    const ctx = await this.getActiveContext(userId);
    const holding = await Holding.findOne({ userId, symbol, side, accountType: ctx.accountType });
    if (!holding) throw new Error(`Không tìm thấy vị thế ${side} nào của ${symbol}`);

    const totalQty = holding.quantity;
    const actualCloseQty = (closeQty && closeQty > 0 && closeQty < totalQty) ? closeQty : totalQty;
    const isPartial = actualCloseQty < totalQty;
    const entryPrice = holding.averagePrice;
    
    // Tính PnL cho lượng đóng
    let pnl = 0;
    if (side === 'LONG') {
      pnl = (currentPrice - entryPrice) * actualCloseQty;
    } else {
      pnl = (entryPrice - currentPrice) * actualCloseQty;
    }

    const marginReturned = (entryPrice * actualCloseQty) / (holding.leverage || 1);
    let totalReturn = marginReturned + pnl;
    
    if (totalReturn < 0) {
      totalReturn = 0;
      pnl = -marginReturned;
    }

    // Trả tiền về đúng loại tài khoản đang hoạt động
    await ctx.addBalance(totalReturn);

    if (isPartial) {
      holding.quantity -= actualCloseQty;
      await holding.save();
    } else {
      await Holding.deleteOne({ _id: holding._id });
    }

    const order = await Order.create({
      userId,
      symbol,
      side: side === 'LONG' ? OrderSide.SHORT : OrderSide.LONG,
      type: OrderType.MARKET,
      quantity: actualCloseQty,
      price: currentPrice,
      margin: marginReturned,
      leverage: holding.leverage || 1,
      status: OrderStatus.FILLED,
      accountType: ctx.accountType
    });

    await Transaction.create({
      userId,
      type: TransactionType.CLOSE_POSITION,
      amount: pnl,
      accountType: ctx.accountType,
      description: `Đóng ${isPartial ? 'một phần' : 'vị thế'} ${side} ${symbol} ở giá ${currentPrice >= 100 ? currentPrice.toLocaleString('vi-VN') : currentPrice.toFixed(2)} | Qty: ${actualCloseQty.toFixed(4)} | Lợi nhuận: ${pnl >= 0 ? '+' : '-'}${Math.abs(pnl) >= 100 ? Math.abs(pnl).toLocaleString('vi-VN') : Math.abs(pnl).toFixed(2)} | Vốn về: ${totalReturn >= 100 ? totalReturn.toLocaleString('vi-VN') : totalReturn.toFixed(2)}`,
      metadata: {
        symbol,
        side,
        entryPrice,
        exitPrice: currentPrice,
        quantity: actualCloseQty,
        leverage: holding.leverage || 1,
        pnl,
        stopLoss: holding.sl,
        takeProfit: holding.tp,
        isOpen: false
      }
    });

    return {
      success: true,
      message: `Đã đóng ${isPartial ? `${actualCloseQty.toFixed(4)} Lot` : 'toàn bộ'} vị thế ${side}. Lợi nhuận: ${pnl >= 0 ? '+' : '-'}${Math.abs(pnl) >= 100 ? Math.abs(pnl).toLocaleString('vi-VN') : Math.abs(pnl).toFixed(2)}`
    };
  }

  /**
   * CẬP NHẬT TP / SL
   */
  static async updateTPSL(userId: string, symbol: string, side: 'LONG'|'SHORT', tp?: number, sl?: number) {
    const ctx = await this.getActiveContext(userId);
    const holding = await Holding.findOne({ userId, symbol, side, accountType: ctx.accountType });
    if (!holding) throw new Error(`Không tìm thấy vị thế ${side} nào của ${symbol} để cập nhật`);
    
    holding.tp = tp;
    holding.sl = sl;
    await holding.save();
    
    return { success: true, message: `Cập nhật TP/SL thành công!` };
  }

  /**
   * BƠM THÊM KÝ QUỸ (ADD MARGIN)
   */
  static async addMargin(userId: string, symbol: string, side: 'LONG'|'SHORT', amount: number) {
    if (amount <= 0) throw new Error("Số tiền bơm thêm phải lớn hơn 0");

    const ctx = await this.getActiveContext(userId);
    if (ctx.availableBalance < amount) {
      throw new Error(`Số dư không đủ. Cần $${amount.toLocaleString('en-US')}`);
    }

    const holding = await Holding.findOne({ userId, symbol, side, accountType: ctx.accountType });
    if (!holding) throw new Error(`Không tìm thấy vị thế ${side} nào của ${symbol}`);

    await ctx.deductBalance(amount);

    const currentMargin = (holding.quantity * holding.averagePrice) / holding.leverage;
    const newMargin = currentMargin + amount;
    const newLeverage = (holding.quantity * holding.averagePrice) / newMargin;

    holding.leverage = newLeverage;
    await holding.save();

    await Transaction.create({
      userId,
      type: TransactionType.BUY_STOCK,
      amount,
      accountType: ctx.accountType,
      description: `Bơm ${amount >= 100 ? amount.toLocaleString('vi-VN') : amount.toFixed(2)} ký quỹ vào lệnh ${side} ${symbol}`
    });

    return { success: true, message: `Bơm ${amount >= 100 ? amount.toLocaleString('vi-VN') : amount.toFixed(2)} ký quỹ thành công!` };
  }

  /**
   * ĐẶT LỆNH CHỜ (Limit / Stop Order)
   */
  static async placeLimitOrder(userId: string, symbol: string, side: 'LONG'|'SHORT', price: number, margin: number, leverage: number, stopLoss?: number, takeProfit?: number, orderType: 'LIMIT' | 'STOP' = 'LIMIT') {
    if (margin <= 0) throw new Error("Ký quỹ (Margin) phải lớn hơn 0");
    if (leverage < 1 || leverage > 1000) throw new Error("Đòn bẩy không hợp lệ");
    if (price <= 0) throw new Error("Giá chờ không hợp lệ");

    const ctx = await this.getActiveContext(userId);
    if (ctx.isChallenge && ctx.challenge) {
      if (ctx.challenge.status === 'FAILED') {
        throw new Error('Bài thi đã bị vi phạm. Vui lòng reset bài thi hoặc hủy thi để tiếp tục.');
      }
      if (ctx.challenge.status === 'PAUSED') {
        throw new Error('Bài thi đang tạm dừng. Vui lòng bấm Tiếp Tục bài thi để mở lệnh.');
      }
      if (ctx.challenge.status === 'PASSED') {
        throw new Error('Bài thi đã hoàn thành xuất sắc! Vui lòng nâng cấp độ tiếp theo.');
      }
      const levelConfig = CHALLENGE_LEVELS.find(l => l.id === ctx.challenge?.currentLevel) || CHALLENGE_LEVELS[0];
      if (leverage > levelConfig.maxLeverage) {
        throw new Error(`Đòn bẩy tối đa cho bài thi Cấp ${levelConfig.id} (${levelConfig.levelName}) là ${levelConfig.maxLeverage}X`);
      }
    }

    if (ctx.availableBalance < margin) {
      throw new Error(`Ký quỹ không đủ. Cần ${margin >= 100 ? margin.toLocaleString('vi-VN') : margin.toFixed(2)}`);
    }

    // Kiểm tra không cho đặt lệnh chờ nếu đang có vị thế ngược chiều
    const oppositeSide = side === 'LONG' ? 'SHORT' : 'LONG';
    const existingOpposite = await Holding.findOne({ userId, symbol, side: oppositeSide, accountType: ctx.accountType });
    if (existingOpposite) {
      throw new Error(`Vui lòng đóng vị thế ${oppositeSide} hiện tại của ${symbol} trước khi đặt lệnh chờ ${side}`);
    }

    // Tạm trừ tiền ký quỹ để giữ chỗ lệnh chờ
    await ctx.deductBalance(margin);

    const quantity = (margin * leverage) / price;

    const order = await Order.create({
      userId,
      symbol,
      side,
      type: orderType,
      quantity,
      price,
      margin,
      leverage,
      stopLoss,
      takeProfit,
      status: OrderStatus.PENDING,
      accountType: ctx.accountType
    });

    await Transaction.create({
      userId,
      type: side === OrderSide.LONG ? TransactionType.BUY_STOCK : TransactionType.SELL_STOCK,
      amount: -margin,
      accountType: ctx.accountType,
      description: `Đặt lệnh chờ ${side} ${orderType} ${symbol} tại ${price >= 100 ? price.toLocaleString('vi-VN') : price.toFixed(2)} | Margin: ${margin >= 100 ? margin.toLocaleString('vi-VN') : margin.toFixed(2)}`
    });

    return { success: true, message: `Đặt lệnh chờ ${side} ${orderType} thành công tại ${price >= 100 ? price.toLocaleString('vi-VN') : price.toFixed(2)}!` };
  }

  /**
   * HỦY LỆNH CHỜ
   */
  static async cancelLimitOrder(userId: string, orderId: string) {
    const order = await Order.findOne({ _id: orderId, userId, status: OrderStatus.PENDING });
    if (!order) throw new Error("Không tìm thấy lệnh chờ hợp lệ");

    order.status = OrderStatus.CANCELLED;
    await order.save();

    const ctx = await this.getActiveContext(userId);
    await ctx.addBalance(order.margin);

    await Transaction.create({
      userId,
      type: TransactionType.DEPOSIT,
      amount: order.margin,
      accountType: order.accountType || ctx.accountType,
      description: `Hủy lệnh chờ ${order.side} ${order.type} ${order.symbol}. Hoàn ký quỹ ${order.margin >= 100 ? order.margin.toLocaleString('vi-VN') : order.margin.toFixed(2)}`
    });

    return { success: true, message: `Hủy lệnh chờ thành công!` };
  }

  /**
   * KIỂM TRA & TỰ ĐỘNG KHỚP LỆNH CHỜ (LIMIT/STOP) VÀ TP/SL TRONG REALTIME
   */
  static async checkPriceTriggers(userId: string, currentPrices: Record<string, number>) {
    if (!userId || !currentPrices || Object.keys(currentPrices).length === 0) return { processed: 0, messages: [] };
    const ctx = await this.getActiveContext(userId);

    let processedCount = 0;
    const messages: string[] = [];

    // 1. Kiểm tra TP / SL cho các vị thế đang mở
    const holdings = await Holding.find({ userId, accountType: ctx.accountType });
    for (const h of holdings) {
      const px = currentPrices[h.symbol];
      if (!px) continue;

      let triggered = false;
      let triggerReason = '';

      // Kiểm tra thanh lý (Liquidation: MMR = 0.4%)
      const mmr = 0.004;
      const margin = (h.averagePrice * h.quantity) / (h.leverage || 1);
      const marginPerUnit = margin / h.quantity;
      const mmPerUnit = h.averagePrice * mmr;
      let isLiquidated = false;

      if (h.side === 'LONG') {
        const rawLiq = h.averagePrice - marginPerUnit + mmPerUnit;
        if (rawLiq > 0 && px <= rawLiq) {
          isLiquidated = true;
          triggerReason = `THANH LÝ (chạm giá thanh lý ${rawLiq.toFixed(2)})`;
        } else if (h.tp && px >= h.tp) { 
          triggered = true; 
          triggerReason = 'Chốt lời (TP)';
        } else if (h.sl && px <= h.sl) { 
          triggered = true; 
          triggerReason = 'Cắt lỗ (SL)';
        }
      } else if (h.side === 'SHORT') {
        const rawLiq = h.averagePrice + marginPerUnit - mmPerUnit;
        if (rawLiq > 0 && px >= rawLiq) {
          isLiquidated = true;
          triggerReason = `THANH LÝ (chạm giá thanh lý ${rawLiq.toFixed(2)})`;
        } else if (h.tp && px <= h.tp) { 
          triggered = true; 
          triggerReason = 'Chốt lời (TP)';
        } else if (h.sl && px >= h.sl) { 
          triggered = true; 
          triggerReason = 'Cắt lỗ (SL)';
        }
      }

      if (isLiquidated || triggered) {
        processedCount++;
        await this.closePosition(userId, h.symbol, h.side, px);
        const msg = `Vị thế ${h.side} ${h.symbol} đã tự động đóng do ${triggerReason} tại giá ${px}`;
        messages.push(msg);
        await createNotification(userId, {
          title: isLiquidated ? '⚠️ Thanh lý vị thế' : '🎯 Khớp lệnh tự động',
          message: msg,
          type: 'TRADE'
        });
      }
    }

    // 2. Kiểm tra các LỆNH CHỜ (PENDING)
    const pendingOrders = await Order.find({ userId, status: OrderStatus.PENDING, accountType: ctx.accountType });
    for (const ord of pendingOrders) {
      const px = currentPrices[ord.symbol];
      if (!px) continue;

      let shouldFill = false;

      if (ord.type === OrderType.LIMIT) {
        if (ord.side === OrderSide.LONG && px <= ord.price) shouldFill = true;
        if (ord.side === OrderSide.SHORT && px >= ord.price) shouldFill = true;
      } else if (ord.type === OrderType.STOP) {
        if (ord.side === OrderSide.LONG && px >= ord.price) shouldFill = true;
        if (ord.side === OrderSide.SHORT && px <= ord.price) shouldFill = true;
      }

      if (shouldFill) {
        // Kiểm tra vị thế ngược chiều trước khi khớp lệnh
        const oppositeSide = ord.side === OrderSide.LONG ? 'SHORT' : 'LONG';
        const oppositeHolding = await Holding.findOne({ userId, symbol: ord.symbol, side: oppositeSide, accountType: ctx.accountType });
        if (oppositeHolding) {
          // Hủy lệnh chờ và hoàn ký quỹ vì có vị thế ngược chiều
          ord.status = OrderStatus.CANCELLED;
          await ord.save();
          await ctx.addBalance(ord.margin);
          await Transaction.create({
            userId,
            type: TransactionType.DEPOSIT,
            amount: ord.margin,
            accountType: ctx.accountType,
            description: `Hủy lệnh chờ ${ord.side} ${ord.type} ${ord.symbol} do có vị thế ${oppositeSide} ngược chiều. Hoàn ký quỹ ${ord.margin >= 100 ? ord.margin.toLocaleString('vi-VN') : ord.margin.toFixed(2)}`
          });
          await createNotification(userId, {
            title: 'Hủy lệnh chờ đối ứng',
            message: `Hủy lệnh chờ ${ord.side} ${ord.type} ${ord.symbol} do có vị thế ngược chiều. Hoàn ký quỹ $${ord.margin.toFixed(2)}`,
            type: 'TRADE'
          });
          continue;
        }

        processedCount++;
        ord.status = OrderStatus.FILLED;
        await ord.save();

        const fillPrice = ord.type === OrderType.LIMIT ? ord.price : px;

        // Mở vị thế (tiền ký quỹ đã trừ khi đặt lệnh)
        const existingHolding = await Holding.findOne({ userId, symbol: ord.symbol, side: ord.side, accountType: ctx.accountType });
        if (existingHolding) {
          const oldVal = existingHolding.quantity * existingHolding.averagePrice;
          const newVal = ord.quantity * fillPrice;
          existingHolding.quantity += ord.quantity;
          existingHolding.averagePrice = (oldVal + newVal) / existingHolding.quantity;
          existingHolding.leverage = ord.leverage;
          if (ord.takeProfit) existingHolding.tp = ord.takeProfit;
          if (ord.stopLoss) existingHolding.sl = ord.stopLoss;
          await existingHolding.save();
        } else {
          await Holding.create({
            userId,
            symbol: ord.symbol,
            side: ord.side,
            quantity: ord.quantity,
            averagePrice: fillPrice,
            leverage: ord.leverage,
            tp: ord.takeProfit,
            sl: ord.stopLoss,
            accountType: ctx.accountType
          });
        }

        await Transaction.create({
          userId,
          type: ord.side === OrderSide.LONG ? TransactionType.BUY_STOCK : TransactionType.SELL_STOCK,
          amount: 0,
          accountType: ctx.accountType,
          description: `Khớp lệnh chờ ${ord.type} ${ord.side} ${ord.symbol} ở giá ${fillPrice >= 100 ? fillPrice.toLocaleString('vi-VN') : fillPrice.toFixed(2)} | Qty: ${ord.quantity.toFixed(4)}`
        });
        messages.push(`Lệnh chờ ${ord.type} ${ord.side} ${ord.symbol} đã khớp tại giá ${fillPrice}`);
        await createNotification(userId, {
          title: 'Khớp lệnh chờ',
          message: `Lệnh chờ ${ord.type} ${ord.side} ${ord.symbol} đã khớp tại giá ${fillPrice >= 100 ? fillPrice.toLocaleString('vi-VN') : fillPrice.toFixed(2)}`,
          type: 'TRADE'
        });
      }
    }

    return { processed: processedCount, messages };
  }

  /**
   * Lấy Danh mục đầu tư (Portfolio) theo đúng trạng thái tài khoản
   */
  static async getPortfolio(userId: string) {
    const ctx = await this.getActiveContext(userId);
    const holdings = await Holding.find({ userId, accountType: ctx.accountType });
    const pendingOrders = await Order.find({ userId, status: OrderStatus.PENDING, accountType: ctx.accountType });

    // Note: To calculate accurate Real-time PnL, the controller should fetch current prices from API
    // and map them into the holdings array before returning to frontend.
    return {
      wallet: {
        balance: ctx.balance,
        availableBalance: ctx.availableBalance,
        isChallenge: ctx.isChallenge,
        accountType: ctx.accountType
      },
      holdings,
      pendingOrders
    };
  }

  /**
   * Lấy lịch sử giao dịch của user (giữ nguyên toàn bộ lịch sử trước đó và trong bài thi)
   */
  static async getTransactions(userId?: string) {
    if (!userId) {
      return await Transaction.find().sort({ createdAt: -1 }).limit(30);
    }
    return await Transaction.find({ userId }).sort({ createdAt: -1 });
  }
}
