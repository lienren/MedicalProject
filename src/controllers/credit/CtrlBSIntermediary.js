/*
 * @Author: Lienren 
 * @Date: 2018-10-22 13:53:15 
 * @Last Modified by: Lienren
 * @Last Modified time: 2018-11-04 12:51:29
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
  '997': '已作废',
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
  searchIntermediary: async ctx => {
    let current = ctx.request.body.current || 1;
    let pageSize = ctx.request.body.pageSize || 20;
    let managerId = ctx.request.body.managerId || 0;
    let iName = ctx.request.body.iName || '';
    let iContact = ctx.request.body.iContact || '';
    let iContactPhone = ctx.request.body.iContactPhone || '';
    let isVerfiy = ctx.request.body.isVerfiy;

    let or = [];

    if (iName !== '') {
      or.push({
        iName: {
          [Op.like]: `%${iName}%`
        }
      });
    }

    if (iContact !== '') {
      or.push({
        iContact: {
          [Op.like]: `%${iContact}%`
        }
      });
    }

    if (iContactPhone !== '') {
      or.push({
        iContactPhone: {
          [Op.like]: `%${iContactPhone}%`
        }
      });
    }

    let condition = {
      [Op.or]: or,
      isDel: 0
    };

    if (managerId > 0) {
      condition.addManagerId = managerId;
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
      isVerfiy: 1,
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
    let isVerfiy = ctx.request.body.isVerfiy || 0;
    let now = date.getTimeStamp();

    assert.notStrictEqual(id, 0, 'InputParamIsNull');

    ctx.orm().BSIntermediary.update(
      {
        isVerfiy: isVerfiy,
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

    if (userSex !== '') {
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

    if (result && result.length > 0) {
      for (let i = 0, j = result.length; i < j; i++) {
        let count = await ctx.orm().BSLoanOrder.count({
          where: {
            userId: result[i].id,
            isVerfiy: 1,
            state: {
              [Op.ne]: 997
            }
          }
        });
        result[i].dataValues.loanCount = count;
      }
    }

    ctx.body = {
      total: resultCount.count,
      list: result,
      current,
      pageSize
    };
  },
  searchLoanUser: async ctx => {
    let current = ctx.request.body.current || 1;
    let pageSize = ctx.request.body.pageSize || 20;
    let managerId = ctx.request.body.managerId || 0;
    let userName = ctx.request.body.userName || '';
    let userPhone = ctx.request.body.userPhone || '';
    let userIdCard = ctx.request.body.userIdCard || '';
    let isVerfiy = ctx.request.body.isVerfiy;

    let or = [];

    if (userName !== '') {
      or.push({
        userName: {
          [Op.like]: `%${userName}%`
        }
      });
    }

    if (userPhone !== '') {
      or.push({
        userPhone: {
          [Op.like]: `%${userPhone}%`
        }
      });
    }

    if (userIdCard !== '') {
      or.push({
        userIdCard: {
          [Op.like]: `%${userIdCard}%`
        }
      });
    }

    let condition = {
      [Op.or]: or,
      isDel: 0
    };

    if (managerId > 0) {
      condition.addManagerId = managerId;
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
      isVerfiy: 1,
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
    let isVerfiy = ctx.request.body.isVerfiy || 0;
    let now = date.getTimeStamp();

    assert.notStrictEqual(id, 0, 'InputParamIsNull');

    ctx.orm().BSLoanUser.update(
      {
        isVerfiy: isVerfiy,
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
    let returnSTime = ctx.request.body.returnSTime || 0;
    let returnETime = ctx.request.body.returnETime || 0;
    let state = ctx.request.body.state || [];
    let isVerfiy = ctx.request.body.isVerfiy || [];

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

    if (userSex !== '') {
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

    if (returnSTime !== 0 && returnETime !== 0) {
      condition.extReturnTime = {
        [Op.between]: [returnSTime, returnETime]
      };
    }

    if (state && state.length > 0) {
      condition.state = {
        [Op.in]: state,
        [Op.ne]: 997
      };
    } else {
      // 排除已作废
      condition.state = {
        [Op.ne]: 997
      };
    }

    if (isVerfiy && isVerfiy.length > 0) {
      condition.isVerfiy = {
        [Op.in]: isVerfiy
      };
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
  getLoanOrderDetail: async ctx => {
    let orderid = ctx.request.body.orderid || 0;
    let managerId = ctx.request.body.managerId || 0;

    let condition = {};

    if (managerId > 0) {
      condition.managerId = managerId;
    }

    if (orderid > 0) {
      condition.id = orderid;
    }

    let result = await ctx.orm().BSLoanOrder.findAll({
      where: condition
    });

    ctx.body = result;
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
      updateTime: now,
      isVerfiy: 0,
      verfiyManagerId: 0,
      verfiyManager: '',
      verfiyManagerPhone: '',
      verfiyTime: 0
    });

    ctx.body = {};
  },
  editLoanOrder: async ctx => {
    let id = ctx.request.body.id || 0;
    let loanPrice = ctx.request.body.loanPrice || 0;
    let loanInterest = ctx.request.body.loanInterest || 0;
    let loanServicePrice = ctx.request.body.loanServicePrice || 0;
    let loanTime = ctx.request.body.loanTime || 0;
    let shouldReturnTime = ctx.request.body.shouldReturnTime || 0;
    let remark = ctx.request.body.remark || '';
    let now = date.getTimeStamp();

    assert.notStrictEqual(loanPrice, 0, 'InputParamIsNull');
    assert.notStrictEqual(loanTime, 0, 'InputParamIsNull');
    assert.notStrictEqual(shouldReturnTime, 0, 'InputParamIsNull');

    ctx.orm().BSLoanOrder.update(
      {
        loanPrice: loanPrice,
        loanInterest: loanInterest,
        loanServicePrice: loanServicePrice,
        lastloanPrice: loanPrice,
        lastloanInterest: loanInterest,
        lastloanServicePrice: loanServicePrice,
        loanTime: loanTime,
        shouldReturnTime: shouldReturnTime,
        remark: remark,
        extReturnTime: shouldReturnTime,
        updateTime: now,
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
  verfiyLoanOrder: async ctx => {
    let id = ctx.request.body.id || 0;
    let isVerfiy = ctx.request.body.isVerfiy || 0;
    let now = date.getTimeStamp();

    assert.notStrictEqual(id, 0, 'InputParamIsNull');

    ctx.orm().BSLoanOrder.update(
      {
        isVerfiy: isVerfiy,
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
  addLoanOrderState: async ctx => {
    let id = ctx.request.body.id || 0;
    let state = ctx.request.body.state || -1;
    let loanPrice = ctx.request.body.loanPrice || 0;
    let loanInterest = ctx.request.body.loanInterest || 0;
    let loanServicePrice = ctx.request.body.loanServicePrice || 0;
    let extPrice = ctx.request.body.extPrice || 0;
    let extLoanTime = ctx.request.body.extLoanTime || 0;
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

    assert.notStrictEqual(result, null, 'LoanOrderNotExists');

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
      state: state,
      stateName: stateNameDist[`${state}`],
      lastRemark: remark,
      updateTime: now
    };

    if (state === 2) {
      // 展期
      /* 展期订单：每一次展期后需要将老订单变成状态是完成，展期订单自动生成一个新的订单，
      展期后显示新订单为展期1、第二次为展期2，一次类推～前一个订单就变成完成，举例子，
      订单展期1需要继续展期，操作展期后，订单展期1变为已完成，自动生成一个订单展期2，输入相关信息，保存订单*/
      // updateParam.extCount = sequelize.literal('`extCount` + 1');
      // updateParam.extPrice = sequelize.literal('`extPrice` + ' + extPrice);
      // updateParam.extReturnTime = extReturnTime;

      // 标记完成
      updateParam.state = 3;
      updateParam.stateName = stateNameDist[`3`];
      updateParam.realReturnPrice = loanPrice;
      updateParam.realReturnTime = now;

      let extCount = result.extCount + 1;
      let orderSn = `${result.orderSn}-${extCount > 9 ? extCount : '0' + extCount}`;

      ctx.orm().BSLoanOrder.create({
        orderSn: orderSn,
        userId: result.userId,
        userName: result.userName,
        userPhone: result.userPhone,
        userSex: result.userSex,
        userIdCard: result.userIdCard,
        userChannel: result.userChannel,
        userSource: result.userSource,
        userSourceName: result.userSourceName,
        userSourceUserName: result.userSourceUserName,
        userSourcePhone: result.userSourcePhone,
        loanPrice: loanPrice,
        loanInterest: loanInterest,
        loanServicePrice: loanServicePrice,
        lastloanPrice: loanPrice,
        lastloanInterest: loanInterest,
        lastloanServicePrice: loanServicePrice,
        loanTime: extLoanTime,
        shouldReturnTime: extReturnTime,
        remark: remark,
        managerId: ctx.work.managerId,
        managerName: ctx.work.managerRealName,
        managerPhone: ctx.work.managerPhone,
        state: 2,
        stateName: stateNameDist[`2`],
        extCount: extCount,
        extPrice: 0,
        extReturnTime: extReturnTime,
        realReturnPrice: 0,
        realReturnTime: 0,
        lastRemark: '',
        addTime: now,
        updateTime: now,
        isVerfiy: 0,
        verfiyManagerId: 0,
        verfiyManager: '',
        verfiyManagerPhone: '',
        verfiyTime: 0
      });
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
  },
  getStsOrders: async ctx => {
    /* let result1 = await ctx
      .orm()
      .sql.select()
      .from('BSLoanOrder')
      .field('sum(lastloanPrice) / 100 as lastloanPrice')
      .field('sum(realReturnPrice) / 100 as realReturnPrice')
      .field('count(1) as loanCount')
      .where('managerId = ? and state != ? and isVerfiy = ?', ctx.work.managerId, 997, 1)
      .query(); */

    let today = date.getTodayTimeStamp();

    let result1 = await ctx
      .orm()
      .sql.select()
      .from('BSLoanOrder')
      .field('sum(lastloanPrice) / 100 as lastloanPrice')
      .field('sum(realReturnPrice) / 100 as realReturnPrice')
      .where(
        'managerId = ? and state != ? and isVerfiy = ? and extReturnTime between ? and ?',
        ctx.work.managerId,
        997,
        1,
        today.starttime,
        today.endtime
      )
      .query();

    let result11 = await ctx
      .orm()
      .sql.select()
      .from('BSLoanOrder')
      .field('sum(lastloanPrice) / 100 as lastloanPrice1')
      .where('managerId = ? and state = ? and isVerfiy = ?', ctx.work.managerId, 4, 1)
      .query();

    let result111 = await ctx
      .orm()
      .sql.select()
      .from('BSLoanOrder')
      .field('sum(lastloanInterest) / 100 as lastloanInterest')
      .where('managerId = ? and state = ? and isVerfiy = ? and ', ctx.work.managerId, 3, 1)
      .query();

    let result3 = await ctx
      .orm()
      .sql.select()
      .from(
        ctx
          .orm()
          .sql.select()
          .from('BSLoanOrder')
          .field("DATE_FORMAT(FROM_UNIXTIME(addTime/1000),'%m/%d') as date")
          .field('lastloanPrice/100 as lastloanPrice')
          .where('managerId = ? and state != ? and isVerfiy = ?', ctx.work.managerId, 997, 1),
        'a'
      )
      .field('a.date')
      .field('sum(a.lastloanPrice) as lastloanPrice')
      .group('a.date')
      .query();

    let result4 = await ctx
      .orm()
      .sql.select()
      .from(
        ctx
          .orm()
          .sql.select()
          .from('BSLoanOrder')
          .field("DATE_FORMAT(FROM_UNIXTIME(realReturnTime/1000),'%m/%d') as date")
          .field('realReturnPrice/100 as realReturnPrice')
          .where('state = ? and managerId = ? and isVerfiy = ?', 3, ctx.work.managerId, 1),
        'a'
      )
      .field('a.date')
      .field('sum(a.realReturnPrice) as realReturnPrice')
      .group('a.date')
      .query();

    let now = new Date().getTime();
    let dayTime = 24 * 3600 * 1000 * -1;
    let month = [];
    for (let i = 0, j = 30; i < j; i++) {
      let dayStr = date.formatDate(new Date(now), 'MM/DD');

      let loadMoney = 0;
      let returnMoney = 0;
      let a = result3.filter(d => {
        return d.date === dayStr;
      });

      if (a && a.length > 0) {
        loadMoney = parseFloat(a[0].lastloanPrice);
      }

      let b = result4.filter(d => {
        return d.date === dayStr;
      });

      if (b && b.length > 0) {
        returnMoney = parseFloat(b[0].realReturnPrice);
      }

      month.push({
        日期: dayStr,
        贷款总金额: loadMoney,
        还款总金额: returnMoney
      });

      now += dayTime;
    }

    month.reverse();

    ctx.body = {
      ...result1[0],
      ...result11[0],
      ...result111[0],
      month: month
    };
  },
  getStsOrdersAll: async ctx => {
    let today = date.getTodayTimeStamp();

    let result1 = await ctx
      .orm()
      .sql.select()
      .from('BSLoanOrder')
      .field('sum(lastloanPrice) / 100 as lastloanPrice')
      .field('sum(realReturnPrice) / 100 as realReturnPrice')
      .where(
        'state != ? and isVerfiy = ? and extReturnTime between ? and ?',
        997,
        1,
        today.starttime,
        today.endtime
      )
      .query();
    
    let result11 = await ctx
      .orm()
      .sql.select()
      .from('BSLoanOrder')
      .field('sum(lastloanPrice) / 100 as lastloanPrice1')
      .where('state = ? and isVerfiy = ?', 4, 1)
      .query();
    
    let result111 = await ctx
      .orm()
      .sql.select()
      .from('BSLoanOrder')
      .field('sum(lastloanInterest) / 100 as lastloanInterest')
      .where('state = ? and isVerfiy = ?', 3, 1)
      .query();

    let result3 = await ctx
      .orm()
      .sql.select()
      .from(
        ctx
          .orm()
          .sql.select()
          .from('BSLoanOrder')
          .field("DATE_FORMAT(FROM_UNIXTIME(addTime/1000),'%m/%d') as date")
          .field('lastloanPrice/100 as lastloanPrice')
          .where('state != ? and isVerfiy = ?', 997, 1),
        'a'
      )
      .field('a.date')
      .field('sum(a.lastloanPrice) as lastloanPrice')
      .group('a.date')
      .query();

    let result4 = await ctx
      .orm()
      .sql.select()
      .from(
        ctx
          .orm()
          .sql.select()
          .from('BSLoanOrder')
          .field("DATE_FORMAT(FROM_UNIXTIME(realReturnTime/1000),'%m/%d') as date")
          .field('realReturnPrice/100 as realReturnPrice')
          .where('state = ? and isVerfiy = ?', 3, 1),
        'a'
      )
      .field('a.date')
      .field('sum(a.realReturnPrice) as realReturnPrice')
      .group('a.date')
      .query();

    let now = new Date().getTime();
    let dayTime = 24 * 3600 * 1000 * -1;
    let month = [];
    for (let i = 0, j = 30; i < j; i++) {
      let dayStr = date.formatDate(new Date(now), 'MM/DD');

      let loadMoney = 0;
      let returnMoney = 0;
      let a = result3.filter(d => {
        return d.date === dayStr;
      });

      if (a && a.length > 0) {
        loadMoney = parseFloat(a[0].lastloanPrice);
      }

      let b = result4.filter(d => {
        return d.date === dayStr;
      });

      if (b && b.length > 0) {
        returnMoney = parseFloat(b[0].realReturnPrice);
      }

      month.push({
        日期: dayStr,
        贷款总金额: loadMoney,
        还款总金额: returnMoney
      });

      now += dayTime;
    }

    month.reverse();

    ctx.body = {
      ...result1[0],
      ...result11[0],
      ...result111[0],
      month: month
    };
  },
  getStsOrderSort: async ctx => {
    let result5 = await ctx
      .orm()
      .sql.select()
      .from(
        ctx
          .orm()
          .sql.select()
          .from('BSLoanOrder')
          .field('managerId')
          .field('sum(lastloanPrice) as lastloanPrice')
          .field('sum(lastloanInterest) as lastloanInterest')
          .field('sum(lastloanServicePrice) as lastloanServicePrice')
          .field('count(1) as loanCount')
          .where('state != ? and isVerfiy = ?', 997, 1)
          .group('managerId'),
        'a'
      )
      .field('a.managerId')
      .field('b.realName')
      .field('b.sex')
      .field('b.depName')
      .field('a.lastloanPrice')
      .field('a.lastloanInterest')
      .field('a.lastloanServicePrice')
      .field('a.loanCount')
      .join('SuperManagerInfo', 'b', 'b.id = a.managerId')
      .order('a.lastloanPrice', false)
      .query();

    let result6 = await ctx
      .orm()
      .sql.select()
      .from('BSLoanOrder')
      .field('managerId')
      .field('sum(lastloanPrice) as lastloanPrice')
      .field('sum(lastloanInterest) as lastloanInterest')
      .field('sum(lastloanServicePrice) as lastloanServicePrice')
      .field('count(1) as loanCount')
      .where('state = ? and isVerfiy = ?', 4, 1)
      .group('managerId')
      .query();

    ctx.body = {
      a: result5,
      b: result6
    };
  }
};
