/*
 * @Author: Lienren 
 * @Date: 2018-10-22 13:53:15 
 * @Last Modified by: Lienren
 * @Last Modified time: 2018-10-22 17:26:31
 */
'use strict';

const sequelize = require('sequelize');
const Op = require('sequelize').Op;
const assert = require('assert');
const date = require('../../utils/date');

let stateNameDist = {
  '1': '待还款',
  '2': '展期',
  '3': '已还款',
  '4': '已逾期',
  '5': '需催收',
  '998': '已撤单',
  '999': '已取消'
};

module.exports = {
  getIntermediary: async ctx => {
    let current = ctx.request.body.current || 1;
    let pageSize = ctx.request.body.pageSize || 20;
    let managerId = ctx.request.body.managerId || 0;
    let iName = ctx.request.body.iName || '';
    let iContact = ctx.request.body.iContact || '';
    let iContactPhone = ctx.request.body.iContactPhone || '';
    let isVerfiy = ctx.request.body.isVerfiy;

    let condition = {
      isDel: 0
    };

    if (managerId > 0) {
      condition.addManagerId = managerId;
    }

    if (iName !== '') {
      condition.iName = {
        [Op.like]: `%${iName}%`
      };
    }

    if (iContact !== '') {
      condition.iContact = {
        [Op.like]: `%${iContact}%`
      };
    }

    if (iContactPhone !== '') {
      condition.iContactPhone = {
        [Op.like]: `%${iContactPhone}%`
      };
    }

    if (isVerfiy !== -1) {
      condition.isVerfiy = isVerfiy;
    }

    let resultCount = await ctx.orm().BSIntermediary.findAndCount({
      where: condition
    });
    let result = await ctx.orm().BSIntermediary.findAll({
      offset: (current - 1) * pageSize,
      limit: pageSize,
      where: condition,
      order: [['id', 'DESC']]
    });

    ctx.body = {
      total: resultCount.count,
      list: result,
      current,
      pageSize
    };
  },
  addIntermediary: async ctx => {
    let iName = ctx.request.body.iName || '';
    let iContact = ctx.request.body.iContact || '';
    let iContactPhone = ctx.request.body.iContactPhone || '';
    let now = date.getTimeStamp();

    assert.notStrictEqual(iName, '', 'InputParamIsNull');
    assert.notStrictEqual(iContact, '', 'InputParamIsNull');
    assert.notStrictEqual(iContactPhone, '', 'InputParamIsNull');

    let sameResult = await ctx.orm().BSIntermediary.findOne({
      where: {
        iName: iName,
        isDel: 0
      }
    });

    assert.ok(sameResult === null, 'IntermediaryNameExists');

    ctx.orm().BSIntermediary.create({
      iName: iName,
      iContact: iContact,
      iContactPhone: iContactPhone,
      isVerfiy: 0,
      addTime: now,
      verfiyManagerId: 0,
      verfiyManager: '',
      verfiyManagerPhone: '',
      verfiyTime: now,
      addManagerId: ctx.work.managerId,
      addManager: ctx.work.managerRealName,
      addManagerPhone: ctx.work.managerPhone,
      isDel: 0
    });

    ctx.body = {};
  },
  editIntermediary: async ctx => {
    let id = ctx.request.body.id || 0;
    let iName = ctx.request.body.iName || '';
    let iContact = ctx.request.body.iContact || '';
    let iContactPhone = ctx.request.body.iContactPhone || '';
    let now = date.getTimeStamp();

    assert.notStrictEqual(iName, '', 'InputParamIsNull');
    assert.notStrictEqual(iContact, '', 'InputParamIsNull');
    assert.notStrictEqual(iContactPhone, '', 'InputParamIsNull');

    let sameResult = await ctx.orm().BSIntermediary.findOne({
      where: {
        iName: iName,
        isDel: 0,
        id: {
          [Op.ne]: id
        }
      }
    });

    assert.ok(sameResult === null, 'IntermediaryNameExists');

    ctx.orm().BSIntermediary.update(
      {
        iName: iName,
        iContact: iContact,
        iContactPhone: iContactPhone,
        isVerfiy: 0
      },
      {
        where: {
          id: id
        }
      }
    );

    ctx.body = {};
  },
  delIntermediary: async ctx => {
    let id = ctx.request.body.id || 0;

    assert.notStrictEqual(id, 0, 'InputParamIsNull');

    ctx.orm().BSIntermediary.update(
      {
        isDel: 1
      },
      {
        where: {
          id: id
        }
      }
    );

    ctx.body = {};
  },
  verfiyIntermediary: async ctx => {
    let id = ctx.request.body.id || 0;
    let now = date.getTimeStamp();

    assert.notStrictEqual(id, 0, 'InputParamIsNull');

    ctx.orm().BSIntermediary.update(
      {
        isVerfiy: 1,
        verfiyTime: now,
        verfiyManagerId: ctx.work.managerId,
        verfiyManager: ctx.work.managerRealName,
        verfiyManagerPhone: ctx.work.managerPhone
      },
      {
        where: {
          id: id
        }
      }
    );

    ctx.body = {};
  },
  getLoanUser: async ctx => {
    let current = ctx.request.body.current || 1;
    let pageSize = ctx.request.body.pageSize || 20;
    let managerId = ctx.request.body.managerId || 0;
    let userName = ctx.request.body.userName || '';
    let userPhone = ctx.request.body.userPhone || '';
    let userSex = ctx.request.body.userSex || '';
    let userIdCard = ctx.request.body.userIdCard || '';
    let isVerfiy = ctx.request.body.isVerfiy;

    let condition = {
      isDel: 0
    };

    if (managerId > 0) {
      condition.addManagerId = managerId;
    }

    if (userName !== '') {
      condition.userName = {
        [Op.like]: `%${userName}%`
      };
    }

    if (userPhone !== '') {
      condition.userPhone = {
        [Op.like]: `%${userPhone}%`
      };
    }

    if (userIdCard !== '') {
      condition.userIdCard = {
        [Op.like]: `%${userIdCard}%`
      };
    }

    if (userSex !== '全部') {
      condition.userSex = userSex;
    }

    if (isVerfiy !== -1) {
      condition.isVerfiy = isVerfiy;
    }

    let resultCount = await ctx.orm().BSLoanUser.findAndCount({
      where: condition
    });
    let result = await ctx.orm().BSLoanUser.findAll({
      offset: (current - 1) * pageSize,
      limit: pageSize,
      where: condition,
      order: [['id', 'DESC']]
    });

    ctx.body = {
      total: resultCount.count,
      list: result,
      current,
      pageSize
    };
  },
  addLoanUser: async ctx => {
    let userName = ctx.request.body.userName || '';
    let userPhone = ctx.request.body.userPhone || '';
    let userSex = ctx.request.body.userSex || '';
    let userIdCard = ctx.request.body.userIdCard || '';
    let now = date.getTimeStamp();

    assert.notStrictEqual(userName, '', 'InputParamIsNull');
    assert.notStrictEqual(userPhone, '', 'InputParamIsNull');
    assert.notStrictEqual(userSex, '', 'InputParamIsNull');
    assert.notStrictEqual(userIdCard, '', 'InputParamIsNull');

    let sameResult = await ctx.orm().BSLoanUser.findOne({
      where: {
        [Op.or]: [{ userName: userName }, { userIdCard: userIdCard }],
        isDel: 0
      }
    });

    assert.ok(sameResult === null, 'LoanUserExists');

    ctx.orm().BSLoanUser.create({
      userName: userName,
      userPhone: userPhone,
      userSex: userSex,
      userIdCard: userIdCard,
      isVerfiy: 0,
      addTime: now,
      verfiyManagerId: 0,
      verfiyManager: '',
      verfiyManagerPhone: '',
      verfiyTime: now,
      addManagerId: ctx.work.managerId,
      addManager: ctx.work.managerRealName,
      addManagerPhone: ctx.work.managerPhone,
      isDel: 0
    });

    ctx.body = {};
  },
  editLoanUser: async ctx => {
    let id = ctx.request.body.id || 0;
    let userName = ctx.request.body.userName || '';
    let userPhone = ctx.request.body.userPhone || '';
    let userSex = ctx.request.body.userSex || '';
    let userIdCard = ctx.request.body.userIdCard || '';
    let now = date.getTimeStamp();

    assert.notStrictEqual(userName, '', 'InputParamIsNull');
    assert.notStrictEqual(userPhone, '', 'InputParamIsNull');
    assert.notStrictEqual(userSex, '', 'InputParamIsNull');
    assert.notStrictEqual(userIdCard, '', 'InputParamIsNull');

    let sameResult = await ctx.orm().BSLoanUser.findOne({
      where: {
        [Op.or]: [{ userName: userName }, { userIdCard: userIdCard }],
        isDel: 0,
        id: {
          [Op.ne]: id
        }
      }
    });

    assert.ok(sameResult === null, 'LoanUserExists');

    ctx.orm().BSLoanUser.update(
      {
        userName: userName,
        userPhone: userPhone,
        userSex: userSex,
        userIdCard: userIdCard,
        isVerfiy: 0
      },
      {
        where: {
          id: id
        }
      }
    );

    ctx.body = {};
  },
  delLoanUser: async ctx => {
    let id = ctx.request.body.id || 0;

    assert.notStrictEqual(id, 0, 'InputParamIsNull');

    ctx.orm().BSLoanUser.update(
      {
        isDel: 1
      },
      {
        where: {
          id: id
        }
      }
    );

    ctx.body = {};
  },
  verfiyLoanUser: async ctx => {
    let id = ctx.request.body.id || 0;
    let now = date.getTimeStamp();

    assert.notStrictEqual(id, 0, 'InputParamIsNull');

    ctx.orm().BSLoanUser.update(
      {
        isVerfiy: 1,
        verfiyTime: now,
        verfiyManagerId: ctx.work.managerId,
        verfiyManager: ctx.work.managerRealName,
        verfiyManagerPhone: ctx.work.managerPhone
      },
      {
        where: {
          id: id
        }
      }
    );

    ctx.body = {};
  },
  getLoanOrder: async ctx => {
    let current = ctx.request.body.current || 1;
    let pageSize = ctx.request.body.pageSize || 20;
    let managerId = ctx.request.body.managerId || 0;
    let orderSn = ctx.request.body.orderSn || '';
    let userName = ctx.request.body.userName || '';
    let userSex = ctx.request.body.userSex || '';
    let userPhone = ctx.request.body.userPhone || '';
    let userIdCard = ctx.request.body.userIdCard || '';
    let userChannel = ctx.request.body.userChannel || '';
    let userSource = ctx.request.body.userSource || '';
    let userSourceName = ctx.request.body.userSourceName || '';
    let userSourceUserName = ctx.request.body.userSourceUserName || '';
    let userSourcePhone = ctx.request.body.userSourcePhone || '';
    let loanMinPrice = ctx.request.body.loanMinPrice || 0;
    let loanMaxPrice = ctx.request.body.loanMaxPrice || 999999999;
    let stime = ctx.request.body.stime || 0;
    let etime = ctx.request.body.etime || 0;
    let state = ctx.request.body.state || -1;

    let condition = {};

    if (managerId > 0) {
      condition.managerId = managerId;
    }

    if (orderSn !== '') {
      condition.orderSn = orderSn;
    }

    if (userName !== '') {
      condition.userName = {
        [Op.like]: `%${userName}%`
      };
    }

    if (userSex !== '全部') {
      condition.userSex = userSex;
    }

    if (userPhone !== '') {
      condition.userPhone = {
        [Op.like]: `%${userPhone}%`
      };
    }

    if (userIdCard !== '') {
      condition.userIdCard = {
        [Op.like]: `%${userIdCard}%`
      };
    }

    if (userChannel !== '') {
      condition.userChannel = userChannel;
    }

    if (userSource !== '') {
      condition.userSource = userSource;
    }

    if (userSourceName !== '') {
      condition.userSourceName = {
        [Op.like]: `%${userSourceName}%`
      };
    }

    condition.lastloanPrice = {
      [Op.between]: [loanMinPrice, loanMaxPrice]
    };

    if (stime !== 0 && etime !== 0) {
      condition.addTime = {
        [Op.between]: [stime, etime]
      };
    }

    if (state !== -1) {
      condition.state = state;
    }

    let resultCount = await ctx.orm().BSLoanOrder.findAndCount({
      where: condition
    });
    let result = await ctx.orm().BSLoanOrder.findAll({
      offset: (current - 1) * pageSize,
      limit: pageSize,
      where: condition,
      order: [['id', 'DESC']]
    });

    ctx.body = {
      total: resultCount.count,
      list: result,
      current,
      pageSize
    };
  },
  addLoanOrder: async ctx => {
    let userId = ctx.request.body.userId || 0;
    let userName = ctx.request.body.userName || '';
    let userSex = ctx.request.body.userSex || '';
    let userPhone = ctx.request.body.userPhone || '';
    let userIdCard = ctx.request.body.userIdCard || '';
    let userChannel = ctx.request.body.userChannel || '';
    let userSource = ctx.request.body.userSource || '';
    let userSourceName = ctx.request.body.userSourceName || '';
    let userSourceUserName = ctx.request.body.userSourceUserName || '';
    let userSourcePhone = ctx.request.body.userSourcePhone || '';
    let loanPrice = ctx.request.body.loanPrice || 0;
    let loanInterest = ctx.request.body.loanInterest || 0;
    let loanServicePrice = ctx.request.body.loanServicePrice || 0;
    let loanTime = ctx.request.body.loanTime || 0;
    let shouldReturnTime = ctx.request.body.shouldReturnTime || 0;
    let remark = ctx.request.body.remark || '';
    let state = ctx.request.body.state || -1;
    let now = date.getTimeStamp();

    assert.notStrictEqual(userId, 0, 'InputParamIsNull');
    assert.notStrictEqual(userName, '', 'InputParamIsNull');
    assert.notStrictEqual(userPhone, '', 'InputParamIsNull');
    assert.notStrictEqual(userSex, '', 'InputParamIsNull');
    assert.notStrictEqual(userIdCard, '', 'InputParamIsNull');
    assert.notStrictEqual(userChannel, '', 'InputParamIsNull');
    assert.notStrictEqual(userSource, '', 'InputParamIsNull');
    assert.notStrictEqual(loanPrice, 0, 'InputParamIsNull');
    assert.notStrictEqual(loanTime, 0, 'InputParamIsNull');
    assert.notStrictEqual(shouldReturnTime, 0, 'InputParamIsNull');
    assert.notStrictEqual(state, -1, 'InputParamIsNull');

    let orderSn = `LA${date.getTimeStamp()}`;

    ctx.orm().BSLoanOrder.create({
      orderSn: orderSn,
      userId: userId,
      userName: userName,
      userPhone: userPhone,
      userSex: userSex,
      userIdCard: userIdCard,
      userChannel: userChannel,
      userSource: userSource,
      userSourceName: userSourceName,
      userSourceUserName: userSourceUserName,
      userSourcePhone: userSourcePhone,
      loanPrice: loanPrice,
      loanInterest: loanInterest,
      loanServicePrice: loanServicePrice,
      lastloanPrice: loanPrice,
      lastloanInterest: loanInterest,
      lastloanServicePrice: loanServicePrice,
      loanTime: loanTime,
      shouldReturnTime: shouldReturnTime,
      remark: remark,
      managerId: ctx.work.managerId,
      managerName: ctx.work.managerRealName,
      managerPhone: ctx.work.managerPhone,
      state: state,
      stateName: stateNameDist[`${state}`],
      extCount: 0,
      extPrice: 0,
      extReturnTime: shouldReturnTime,
      realReturnPrice: 0,
      realReturnTime: 0,
      lastRemark: '',
      addTime: now,
      updateTime: now
    });

    ctx.body = {};
  },
  addLoanOrderState: async ctx => {
    let id = ctx.request.body.id || 0;
    let state = ctx.request.body.state || -1;
    let loanPrice = ctx.request.body.loanPrice || 0;
    let loanInterest = ctx.request.body.loanInterest || 0;
    let loanServicePrice = ctx.request.body.loanServicePrice || 0;
    let extPrice = ctx.request.body.extPrice || 0;
    let extReturnTime = ctx.request.body.extReturnTime || 0;
    let remark = ctx.request.body.remark || '';
    let now = date.getTimeStamp();

    assert.notStrictEqual(id, 0, 'InputParamIsNull');
    assert.notStrictEqual(state, -1, 'InputParamIsNull');

    let result = await ctx.orm().BSLoanOrder.findOne({
      where: {
        id: id
      }
    });

    assert.ok(result === null, 'LoanOrderNotExists');

    ctx.orm().BSLoanOrderState.create({
      orderId: id,
      orderSn: result.orderSn,
      state: state,
      stateName: stateNameDist[`${state}`],
      extPrice: extPrice,
      extReturnTime: extReturnTime,
      remark: remark,
      addTime: now,
      managerId: ctx.work.managerId,
      managerName: ctx.work.managerRealName,
      managerPhone: ctx.work.managerPhone,
      loanPrice: loanPrice,
      loanInterest: loanInterest,
      loanServicePrice: loanServicePrice
    });

    let updateParam = {
      lastloanPrice: loanPrice,
      lastloanInterest: loanInterest,
      lastloanServicePrice: loanServicePrice,
      state: state,
      stateName: stateNameDist[`${state}`],
      lastRemark: remark,
      updateTime: now
    };

    if (state === 2) {
      // 展期
      updateParam.extCount = sequelize.literal('`extCount` + 1');
      updateParam.extPrice = sequelize.literal('`extPrice` + ' + extPrice);
      updateParam.extReturnTime = extReturnTime;
    }

    if (state === 3) {
      // 已还款
      updateParam.realReturnPrice = loanPrice;
      updateParam.realReturnTime = now;
    }

    ctx.orm().BSLoanOrder.update(updateParam, {
      where: {
        id: id
      }
    });

    ctx.body = {};
  },
  getLoanOrderState: async ctx => {
    let orderId = ctx.request.body.orderId || 0;
    let managerId = ctx.request.body.managerId || 0;

    assert.notStrictEqual(id, 0, 'InputParamIsNull');

    let condition = {
      orderId: orderId
    };

    if (managerId > 0) {
      condition.managerId = managerId;
    }

    let result = await ctx.orm().BSLoanOrderState.findAll({
      where: condition,
      order: [['id', 'DESC']]
    });

    ctx.body = result;
  }
};
