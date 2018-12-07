/*
 * @Author: Lienren
 * @Date: 2018-11-22 14:07:43
 * @Last Modified by: Lienren
 * @Last Modified time: 2018-12-07 16:18:50
 */
'use strict';

const path = require('path');
const Op = require('sequelize').Op;
const assert = require('assert');
const _ = require('lodash');
const date = require('../../utils/date');
const comm = require('../../utils/comm');
const encrypt = require('../../utils/encrypt');
const validate = require('../../utils/validate');
const io = require('../../utils/io');

const configData = require('../ConfigData');

// const payKey = 'gNociwieX1aCSkhvVemcXkaF9KVmkXm8';
// const payMerid = 'yft2017082500005';
// const subMerchantName = '诚友信凭证管理平台'
// const subMerchantName = '';
const payParter = '2279';
const payKey = '77b981207372444e9e49acba57512ec6';
const notifyUrl = 'http://inspiring-all.com:20001/proof/setLoanPay';
const returnUrl = 'http://inspiring-all.com:20001/webproof/paysucc';
const domainUrl = '';

const userStateNameDist = {
  '1': '开启',
  '2': '禁用',
  '3': '删除'
};
const loanTypeNameDist = {
  '1': '借款方发起',
  '2': '放款方发起'
};
const loanUseNameDist = {
  '1': '日常消费',
  '2': '医疗',
  '3': '旅游',
  '4': '装修',
  '5': '教育'
};
const loanStateNameDist = {
  '1': '待付款',
  '2': '待确认',
  '3': '已生效',
  '4': '已还款',
  '5': '已完成',
  '777': '已失效',
  '888': '已关闭',
  '999': '已删除'
};
const payTypeNameDist = {
  '1': '未支付',
  '2': '已支付',
  '999': '支付失败'
};
const payMentTypeNameDist = {
  '962': '中信银行',
  '963': '中国银行',
  '964': '中国农业银行',
  '965': '中国建设银行',
  '966': '中国工商银行（仅限工行手机签约客户）',
  '967': '中国工商银行（全国范围）',
  '968': '浙商银行',
  '969': '浙江稠州商业银行',
  '970': '招商银行',
  '971': '邮政储蓄',
  '972': '兴业银行',
  '973': '顺德农村信用合作社',
  '974': '深圳发展银行',
  '975': '上海银行',
  '976': '上海农村商业银行',
  '977': '浦东发展银行',
  '978': '平安银行',
  '979': '南京银行',
  '980': '民生银行',
  '981': '交通银行',
  '982': '华夏银行',
  '983': '杭州银行',
  '984': '广州市农村信用社|广州市商业银行',
  '985': '广东发展银行',
  '986': '光大银行',
  '987': '东亚银行',
  '988': '渤海银行',
  '989': '北京银行',
  '990': '北京农村商业银行',
  '992': '支付宝',
  '1000': '银联扫码(银行app，美团，京东等)',
  '1004': '微信',
  '1006': '手机支付宝',
  '1007': '手机微信',
  '1008': 'QQ扫码/Wap（自动判断）'
};

module.exports = {
  getStsOrdersAll: async ctx => {
    let today = date.getTodayTimeStamp();
    let result1 = await ctx
      .orm()
      .sql.select()
      .from('ProofLoan')
      .field('count(1) as todayLoanCount')
      .where('addTime between ? and ?', today.starttime, today.endtime)
      .query();

    let result11 = await ctx
      .orm()
      .sql.select()
      .from('ProofLoan')
      .field('sum(serviceMoney) / 100 as todayServiceMoney')
      .where('isPay = ? and addTime between ? and ?', 1, today.starttime, today.endtime)
      .query();

    let result111 = await ctx
      .orm()
      .sql.select()
      .from('ProofLoan')
      .field('count(1) as loanCount')
      .query();

    let result1111 = await ctx
      .orm()
      .sql.select()
      .from('ProofLoan')
      .field('sum(serviceMoney) / 100 as serviceMoney')
      .where('isPay = ?', 1)
      .query();

    let result3 = await ctx
      .orm()
      .sql.select()
      .from(
        ctx
          .orm()
          .sql.select()
          .from('ProofLoan')
          .field("DATE_FORMAT(FROM_UNIXTIME(addTime/1000),'%m/%d') as date")
          .field('serviceMoney/100 as serviceMoney')
          .where('isPay = ?', 1),
        'a'
      )
      .field('a.date')
      .field('sum(a.serviceMoney) as serviceMoney')
      .field('count(a.serviceMoney) as loanCount')
      .group('a.date')
      .query();

    let now = new Date().getTime();
    let dayTime = 24 * 3600 * 1000 * -1;
    let month = [];
    for (let i = 0, j = 30; i < j; i++) {
      let dayStr = date.formatDate(new Date(now), 'MM/DD');

      let serviceMoney = 0;
      let loanCount = 0;
      let a = result3.filter(d => {
        return d.date === dayStr;
      });

      if (a && a.length > 0) {
        serviceMoney = parseFloat(a[0].serviceMoney);
        loanCount = parseFloat(a[0].loanCount);
      }

      month.push({
        日期: dayStr,
        下单数: loanCount,
        服务费总金额: serviceMoney
      });

      now += dayTime;
    }

    month.reverse();

    ctx.body = {
      ...result1[0],
      ...result11[0],
      ...result111[0],
      ...result1111[0],
      month: month
    };
  },
  getUsers: async ctx => {
    let current = ctx.request.body.current || 1;
    let pageSize = ctx.request.body.pageSize || 20;
    let userName = ctx.request.body.userName || '';
    let userRealName = ctx.request.body.userRealName || '';
    let userPhone = ctx.request.body.userPhone || '';
    let userIdCard = ctx.request.body.userIdCard || '';
    let state = ctx.request.body.state || [];
    let stime = ctx.request.body.stime || 0;
    let etime = ctx.request.body.etime || 0;

    let condition = {};

    if (userName !== '') {
      condition.userName = {
        [Op.like]: `%${userName}%`
      };
    }

    if (userRealName !== '') {
      condition.userRealName = {
        [Op.like]: `%${userRealName}%`
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

    if (state.length > 0) {
      condition.state = {
        [Op.in]: state
      };
    }

    if (stime > 0 && etime > 0) {
      condition.addTime = {
        [Op.between]: [stime, etime]
      };
    }

    let resultCount = await ctx.orm().ProofUser.findAndCount({
      where: condition
    });
    let result = await ctx.orm().ProofUser.findAll({
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
  setUserState: async ctx => {
    let id = ctx.request.body.id || 0;
    let state = ctx.request.body.state || 1;

    assert.notStrictEqual(id, 0, '入参不正确！');

    let now = date.getTimeStamp();

    ctx.orm().ProofUser.update(
      {
        state: state,
        stateName: userStateNameDist[`${state}`],
        updateTime: now
      },
      {
        where: {
          id: id
        }
      }
    );

    ctx.body = {};
  },
  getLoans: async ctx => {
    let current = ctx.request.body.current || 1;
    let pageSize = ctx.request.body.pageSize || 20;
    let loanSn = ctx.request.body.loanSn || '';
    let loanUserPhone = ctx.request.body.loanUserPhone || '';
    let loanUserRealName = ctx.request.body.loanUserRealName || '';
    let loanUserIdCard = ctx.request.body.loanUserIdCard || '';
    let masterUserPhone = ctx.request.body.masterUserPhone || '';
    let masterUserRealName = ctx.request.body.masterUserRealName || '';
    let masterUserIdCard = ctx.request.body.masterUserIdCard || '';
    let confirmUserPhone = ctx.request.body.confirmUserPhone || '';
    let minLoanMoney = ctx.request.body.minLoanMoney || 0;
    let maxLoanMoney = ctx.request.body.maxLoanMoney || 999999999;
    let sloanTime = ctx.request.body.sloanTime || 0;
    let eloanTime = ctx.request.body.eloanTime || 0;
    let srepayTime = ctx.request.body.srepayTime || 0;
    let erepayTime = ctx.request.body.erepayTime || 0;
    let rate = ctx.request.body.rate || -1;
    let loanUse = ctx.request.body.loanUse || -1;
    let state = ctx.request.body.state || [];
    let minServiceMoney = ctx.request.body.minServiceMoney || 0;
    let maxServiceMoney = ctx.request.body.maxServiceMoney || 999999999;
    let isPay = ctx.request.body.isPay || -1;
    let spayTime = ctx.request.body.spayTime || 0;
    let epayTime = ctx.request.body.epayTime || 0;
    let loanType = ctx.request.body.loanType || -1;
    let payMentType = ctx.request.body.payMentType || -1;
    let stime = ctx.request.body.stime || 0;
    let etime = ctx.request.body.etime || 0;

    let condition = {};

    if (loanSn !== '') {
      condition.loanSn = loanSn;
    }

    if (loanUserPhone !== '') {
      condition.loanUserPhone = {
        [Op.like]: `%${loanUserPhone}%`
      };
    }

    if (loanUserRealName !== '') {
      condition.loanUserRealName = {
        [Op.like]: `%${loanUserRealName}%`
      };
    }

    if (loanUserIdCard !== '') {
      condition.loanUserIdCard = {
        [Op.like]: `%${loanUserIdCard}%`
      };
    }

    if (masterUserPhone !== '') {
      condition.masterUserPhone = {
        [Op.like]: `%${masterUserPhone}%`
      };
    }

    if (masterUserRealName !== '') {
      condition.masterUserRealName = {
        [Op.like]: `%${masterUserRealName}%`
      };
    }

    if (masterUserIdCard !== '') {
      condition.masterUserIdCard = {
        [Op.like]: `%${masterUserIdCard}%`
      };
    }

    if (confirmUserPhone !== '') {
      condition.confirmUserPhone = {
        [Op.like]: `%${confirmUserPhone}%`
      };
    }

    condition.loanMoney = {
      [Op.between]: [minLoanMoney, maxLoanMoney]
    };

    if (sloanTime > 0 && eloanTime > 0) {
      condition.loanTime = {
        [Op.between]: [sloanTime, eloanTime]
      };
    }

    if (srepayTime > 0 && erepayTime > 0) {
      condition.repayTime = {
        [Op.between]: [srepayTime, erepayTime]
      };
    }

    if (rate > -1) {
      condition.rate = rate;
    }

    if (loanUse > -1) {
      condition.loanUse = loanUse;
    }

    if (state.length > 0) {
      condition.state = {
        [Op.in]: state
      };
    }

    if (isPay > -1) {
      condition.isPay = isPay;
    }

    if (spayTime > 0 && epayTime > 0) {
      condition.payTime = {
        [Op.between]: [spayTime, epayTime]
      };
    }

    condition.serviceMoney = {
      [Op.between]: [minServiceMoney, maxServiceMoney]
    };

    if (loanType > -1) {
      condition.loanType = loanType;
    }

    if (payMentType > -1) {
      condition.payMentType = payMentType;
    }

    if (stime > 0 && etime > 0) {
      condition.addTime = {
        [Op.between]: [stime, etime]
      };
    }

    let resultCount = await ctx.orm().ProofLoan.findAndCount({
      where: condition
    });
    let result = await ctx.orm().ProofLoan.findAll({
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
  setAllLoanState: async ctx => {
    let id = ctx.request.body.id || 0;
    let state = ctx.request.body.state || 0;

    assert.notStrictEqual(id, 0, '入参不正确！');
    assert.notStrictEqual(state, 0, '入参不正确！');

    let now = date.getTimeStamp();

    ctx.orm().ProofLoan.update(
      {
        state: state,
        stateName: loanStateNameDist[`${state}`],
        updateTime: now
      },
      {
        where: {
          id: id
        }
      }
    );

    ctx.body = {};
  },
  getProofConfig: async ctx => {
    let tpName = ctx.request.body.tpName || 'serviceMoney';

    let result = await ctx.orm().ProofConfig.findOne({
      where: {
        tpName: tpName
      }
    });

    ctx.body = result;
  },
  setProofConfig: async ctx => {
    let tpName = ctx.request.body.tpName || '';
    let tpValue = ctx.request.body.tpValue || {};

    assert.notStrictEqual(tpName, '', '入参不正确！');

    ctx.orm().ProofConfig.update(
      {
        tpValue: JSON.stringify(tpValue)
      },
      {
        where: {
          tpName: tpName
        }
      }
    );

    ctx.body = {};
  },
  register: async ctx => {
    let userName = ctx.request.body.userName || '';
    let userPhone = ctx.request.body.userPhone || '';
    let userRealName = ctx.request.body.userRealName || '';
    let userIdCard = ctx.request.body.userIdCard || '';
    let userPwd = ctx.request.body.userPwd || '';
    let imgCode = ctx.request.body.imgCode || '';
    let imgCodeToken = ctx.request.body.imgCodeToken || '';

    assert.notStrictEqual(userPhone, '', '入参不正确！');
    assert.notStrictEqual(userRealName, '', '入参不正确！');
    assert.notStrictEqual(userIdCard, '', '入参不正确！');
    assert.notStrictEqual(userPwd, '', '入参不正确！');
    assert.notStrictEqual(imgCode, '', '入参不正确！');
    assert.notStrictEqual(imgCodeToken, '', '入参不正确！');
    assert.notStrictEqual(validate.chkFormat(userPhone, 'phone'), false, '入参不正确！');

    let now = date.getTimeStamp();

    // 验证图形验证码
    let resultImgCodeToken = await ctx.orm().BaseImgCode.findOne({
      where: {
        token: imgCodeToken,
        imgCode: imgCode.toLocaleUpperCase(),
        isUse: 0,
        overTime: {
          [Op.gt]: now
        }
      }
    });
    assert.notStrictEqual(resultImgCodeToken, null, configData.ERROR_KEY_ENUM.ImageCodeIsFail);

    // 设置图形验证码已使用
    ctx.orm().BaseImgCode.update(
      {
        isUse: 1
      },
      {
        where: {
          token: imgCodeToken,
          imgCode: imgCode
        }
      }
    );

    let userInfo = await ctx.orm().ProofUser.findOne({
      where: {
        [Op.or]: [
          {
            userPhone: userPhone
          },
          {
            userIdCard: userIdCard
          }
        ]
      }
    });

    if (userInfo) {
      assert.ok(false, '该用户已注册过了！');
      return;
    }

    let state = 1;
    let userSalt = comm.randCode(6);
    let eny_userPwd = encrypt.getMd5(`${userPwd}_Proof_${userSalt}`);
    let resultUserInfo = await ctx.orm().ProofUser.create({
      userName,
      userPhone,
      userRealName,
      userIdCard,
      userPwd: eny_userPwd,
      userSalt,
      payPwd: '',
      paySalt: '',
      addTime: now,
      updateTime: now,
      token: '',
      tokenOverTime: 0,
      state: state,
      stateName: userStateNameDist[`${state}`]
    });

    ctx.orm().ProofLoan.update(
      {
        masterUserId: resultUserInfo.id,
        masterUserRealName: userRealName,
        masterUserIdCard: userIdCard,
        confirmUserId: resultUserInfo.id,
        confirmRealName: userRealName
      },
      {
        where: {
          masterUserId: 0,
          confirmUserId: 0,
          masterUserPhone: userPhone,
          confirmUserPhone: userPhone
        }
      }
    );

    ctx.orm().ProofLoan.update(
      {
        loanUserId: resultUserInfo.id,
        loanUserRealName: userRealName,
        loanUserIdCard: userIdCard,
        confirmUserId: resultUserInfo.id,
        confirmRealName: userRealName
      },
      {
        where: {
          loanUserId: 0,
          confirmUserId: 0,
          loanUserPhone: userPhone,
          confirmUserPhone: userPhone
        }
      }
    );

    ctx.body = {};
  },
  login: async ctx => {
    let userPhone = ctx.request.body.userPhone || '';
    let userPwd = ctx.request.body.userPwd || '';
    let imgCode = ctx.request.body.imgCode || '';
    let imgCodeToken = ctx.request.body.imgCodeToken || '';

    assert.notStrictEqual(userPhone, '', '入参不正确！');
    assert.notStrictEqual(userPwd, '', '入参不正确！');
    assert.notStrictEqual(imgCode, '', '入参不正确！');
    assert.notStrictEqual(imgCodeToken, '', '入参不正确！');

    let now = date.getTimeStamp();

    // 验证图形验证码
    let resultImgCodeToken = await ctx.orm().BaseImgCode.findOne({
      where: {
        token: imgCodeToken,
        imgCode: imgCode.toLocaleUpperCase(),
        isUse: 0,
        overTime: {
          [Op.gt]: now
        }
      }
    });
    assert.notStrictEqual(resultImgCodeToken, null, configData.ERROR_KEY_ENUM.ImageCodeIsFail);

    // 设置图形验证码已使用
    ctx.orm().BaseImgCode.update(
      {
        isUse: 1
      },
      {
        where: {
          token: imgCodeToken,
          imgCode: imgCode
        }
      }
    );

    let userInfo = await ctx.orm().ProofUser.findOne({
      where: {
        userPhone: userPhone,
        state: 1
      }
    });

    assert.notStrictEqual(userInfo, null, '用户不存在，请先去注册！');

    let eny_userPwd = encrypt.getMd5(`${userPwd}_Proof_${userInfo.userSalt}`);
    assert.ok(userInfo.userPwd === eny_userPwd, '登录失败，密码不正确！');

    let token = comm.getGuid();
    let tokenOverTime = now + 60000 * 60 * 1000;

    ctx.orm().ProofUser.update(
      {
        token: token,
        tokenOverTime: tokenOverTime,
        updateTime: now
      },
      {
        where: {
          userPhone: userPhone
        }
      }
    );

    ctx.body = {
      userId: userInfo.id,
      userPhone: userInfo.userPhone,
      userRealName: userInfo.userRealName,
      token: token
    };
  },
  getUserLoanList: async ctx => {
    let pendPayLoans = await ctx.orm().ProofLoan.findAll({
      where: {
        userId: ctx.work.userId,
        state: {
          [Op.in]: [1, 2]
        }
      },
      order: [['id', 'DESC']]
    });
    let pendConfirmLoans = await ctx.orm().ProofLoan.findAll({
      where: {
        confirmUserId: ctx.work.userId,
        state: 2,
        isPay: 1
      },
      order: [['id', 'DESC']]
    });
    let validLoans = await ctx.orm().ProofLoan.findAll({
      where: {
        [Op.or]: [
          {
            loanUserId: ctx.work.userId
          },
          {
            masterUserId: ctx.work.userId
          }
        ],
        state: {
          [Op.in]: [3, 4, 5]
        }
      },
      order: [['id', 'DESC']]
    });

    let pendLoans = _.concat(pendPayLoans, pendConfirmLoans);

    ctx.body = {
      pendLoans,
      validLoans
    };
  },
  getUserLoan: async ctx => {
    let loanId = ctx.request.body.loanId || 0;

    assert.notStrictEqual(loanId, 0, '入参不正确！');

    let result = await ctx.orm().ProofLoan.findOne({
      where: {
        id: loanId,
        state: {
          [Op.notIn]: [777, 888, 999]
        }
      }
    });

    if (result) {
      result.loanUserSign = result.loanUserSign ? domainUrl + result.loanUserSign : result.loanUserSign;
      result.masterUserSign = result.masterUserSign ? domainUrl + result.masterUserSign : result.masterUserSign;
    }

    ctx.body = result;
  },
  checkPhoneIsRegister: async ctx => {
    let phone = ctx.request.body.phone || '';

    assert.notStrictEqual(phone, '', '入参不正确！');

    let userInfo = await ctx.orm().ProofUser.findOne({
      where: {
        userPhone: phone,
        state: 1
      }
    });

    ctx.body = {
      state: userInfo ? 1 : 0
    };
  },
  calculationServiceMoney: async ctx => {
    let loanMoney = ctx.request.body.loanMoney || 0;

    // assert.notStrictEqual(loanMoney, 0, '入参不正确！');

    let serviceMoney = 0;

    let proofConfig = await ctx.orm().ProofConfig.findOne({
      where: {
        tpName: 'serviceMoney'
      }
    });

    if (proofConfig) {
      let serviceMoneyRule = proofConfig.tpValue && proofConfig.tpValue !== '' ? JSON.parse(proofConfig.tpValue) : {};

      if (serviceMoneyRule && serviceMoneyRule.ruleType) {
        switch (serviceMoneyRule.ruleType) {
          case 'fix':
            serviceMoney = parseInt(serviceMoneyRule.ruleVal);
            break;
          case 'scale':
            serviceMoney = parseInt((loanMoney * serviceMoneyRule.ruleVal) / 100);
            break;
        }
      }
    }

    ctx.body = {
      serviceMoney
    };
  },
  setUserLoan: async ctx => {
    let loanType = ctx.request.body.loanType || 1;
    let phone = ctx.request.body.phone || '';
    let loanMoney = ctx.request.body.loanMoney || 0;
    let loanTime = ctx.request.body.loanTime || 0;
    let repayTime = ctx.request.body.repayTime || 0;
    let rate = ctx.request.body.rate || 0;
    let loanUse = ctx.request.body.loanUse || 1;
    let remark = ctx.request.body.remark || '';
    let userSign = ctx.request.body.userSign || '';

    assert.notStrictEqual(phone, '', '入参不正确！');
    assert.notStrictEqual(loanMoney, 0, '入参不正确！');
    assert.notStrictEqual(loanTime, 0, '入参不正确！');
    assert.notStrictEqual(repayTime, 0, '入参不正确！');
    assert.notStrictEqual(userSign, '', '入参不正确！');
    assert.notStrictEqual(validate.chkFormat(phone, 'phone'), false, '入参不正确！');

    let userId = 0;
    let userPhone = phone;
    let userRealName = '';
    let userIdCard = '';
    let userInfo = await ctx.orm().ProofUser.findOne({
      where: {
        userPhone: phone,
        state: 1
      }
    });
    if (userInfo) {
      userId = userInfo.id;
      userRealName = userInfo.userRealName;
      userIdCard = userInfo.userIdCard;
    }

    let now = date.getTimeStamp();
    let loanSn = `Pr${now}`;
    let state = 1;
    let serviceMoney = 0;
    let isPay = 0;
    let payTime = 0;
    let userSignFilePath = path.resolve(__dirname, '../../../assets/uploads/sign/');
    let userSignFileName = `${loanSn}_${loanType}_${ctx.work.userId}`;
    let userSignVirtualFilePath = `/uploads/sign/${userSignFileName}.png`;

    // 存储签名
    io.base64ToImage(userSign, userSignFilePath, userSignFileName);

    let proofConfig = await ctx.orm().ProofConfig.findOne({
      where: {
        tpName: 'serviceMoney'
      }
    });

    if (proofConfig) {
      let serviceMoneyRule = proofConfig.tpValue && proofConfig.tpValue !== '' ? JSON.parse(proofConfig.tpValue) : {};

      if (serviceMoneyRule && serviceMoneyRule.ruleType) {
        switch (serviceMoneyRule.ruleType) {
          case 'fix':
            serviceMoney = parseInt(serviceMoneyRule.ruleVal);
            break;
          case 'scale':
            serviceMoney = parseInt((loanMoney * serviceMoneyRule.ruleVal) / 100);
            break;
        }
      }
    }

    if (serviceMoney === 0) {
      state = 2;
      isPay = 1;
      payTime = now;
    }

    let proofInfo;
    switch (loanType) {
      case 1:
        proofInfo = await ctx.orm().ProofLoan.create({
          userId: ctx.work.userId,
          loanSn,
          loanUserId: ctx.work.userId,
          loanUserPhone: ctx.work.userPhone,
          loanUserRealName: ctx.work.userRealName,
          loanUserIdCard: ctx.work.userIdCard,
          masterUserId: userId,
          masterUserPhone: userPhone,
          masterUserRealName: userRealName,
          masterUserIdCard: userIdCard,
          loanMoney,
          loanTime,
          repayTime,
          rate,
          loanUse,
          loanUseName: loanUseNameDist[`${loanUse}`],
          state: state,
          stateName: loanStateNameDist[`${state}`],
          serviceMoney: serviceMoney,
          isPay,
          payTime,
          remark,
          loanUserSign: userSignVirtualFilePath,
          masterUserSign: '',
          loanPdf: '',
          addTime: now,
          updateTime: now,
          confirmUserId: userId,
          confirmUserPhone: userPhone,
          confirmRealName: userRealName,
          loanType,
          loanTypeName: loanTypeNameDist[`${loanType}`]
        });
        break;
      case 2:
        proofInfo = await ctx.orm().ProofLoan.create({
          userId: ctx.work.userId,
          loanSn,
          loanUserId: userId,
          loanUserPhone: userPhone,
          loanUserRealName: userRealName,
          loanUserIdCard: userIdCard,
          masterUserId: ctx.work.userId,
          masterUserPhone: ctx.work.userPhone,
          masterUserRealName: ctx.work.userRealName,
          masterUserIdCard: ctx.work.userIdCard,
          loanMoney,
          loanTime,
          repayTime,
          rate,
          loanUse,
          loanUseName: loanUseNameDist[`${loanUse}`],
          state: state,
          stateName: loanStateNameDist[`${state}`],
          serviceMoney: serviceMoney,
          isPay,
          payTime,
          remark,
          loanUserSign: '',
          masterUserSign: userSignVirtualFilePath,
          loanPdf: '',
          addTime: now,
          updateTime: now,
          confirmUserId: userId,
          confirmUserPhone: userPhone,
          confirmRealName: userRealName,
          loanType,
          loanTypeName: loanTypeNameDist[`${loanType}`]
        });
        break;
    }

    ctx.body = {
      id: proofInfo.id
    };
  },
  setConfirmLoan: async ctx => {
    let loanId = ctx.request.body.loanId || 0;
    let userSign = ctx.request.body.userSign || '';

    assert.notStrictEqual(loanId, 0, '入参不正确！');
    assert.notStrictEqual(userSign, '', '入参不正确！');

    let loanInfo = await ctx.orm().ProofLoan.findOne({
      where: {
        id: loanId,
        state: 2,
        isPay: 1
      }
    });
    assert.notStrictEqual(loanInfo, null, '单据不存在！！');

    let userSignFilePath = path.resolve(__dirname, '../../../assets/uploads/sign/');
    let userSignFileName = `${loanInfo.loanSn}_${loanInfo.loanType}_${ctx.work.userId}`;
    let userSignVirtualFilePath = `/uploads/sign/${userSignFileName}.png`;

    // 存储签名
    io.base64ToImage(userSign, userSignFilePath, userSignFileName);

    // TODO:生成PDF
    let pdfFilePath = '';

    let now = date.getTimeStamp();
    let state = 3;
    switch (loanInfo.loanType) {
      case 1:
        ctx.orm().ProofLoan.update(
          {
            state,
            stateName: loanStateNameDist[`${state}`],
            masterUserSign: userSignVirtualFilePath,
            loanPdf: pdfFilePath,
            updateTime: now
          },
          {
            where: {
              id: loanId,
              confirmUserId: ctx.work.userId,
              state: 2,
              isPay: 1
            }
          }
        );
        break;
      case 2:
        ctx.orm().ProofLoan.update(
          {
            state,
            stateName: loanStateNameDist[`${state}`],
            loanUserSign: userSignVirtualFilePath,
            loanPdf: pdfFilePath,
            updateTime: now
          },
          {
            where: {
              id: loanId,
              confirmUserId: ctx.work.userId,
              state: 2,
              isPay: 1
            }
          }
        );
        break;
    }

    ctx.body = {};
  },
  setLoanState: async ctx => {
    let loanId = ctx.request.body.loanId || 0;
    let loanState = ctx.request.body.loanState || 0;

    assert.notStrictEqual(loanId, 0, '入参不正确！');
    assert.notStrictEqual(loanState < 4 || loanState > 5, true, '入参不正确！');

    let now = date.getTimeStamp();

    ctx.orm().ProofLoan.update(
      {
        state: loanState,
        stateName: loanStateNameDist[`${loanState}`],
        updateTime: now
      },
      {
        where: {
          id: loanId,
          masterUserId: ctx.work.userId,
          state: {
            [Op.lt]: loanState
          },
          isPay: 1
        }
      }
    );

    ctx.body = {};
  },
  getLoanByPay: async ctx => {
    let loanId = ctx.request.body.loanId || 0;
    let payMentType = ctx.request.body.payMentType || 1007;

    assert.notStrictEqual(loanId, 0, '入参不正确！');

    let now = date.getTimeStamp();

    let loanInfo = await ctx.orm().ProofLoan.findOne({
      where: {
        id: loanId,
        userId: ctx.work.userId,
        isPay: 0,
        state: 1
      }
    });

    assert.notStrictEqual(loanInfo, null, '单据不存在！');

    /* let merchantOutOrderNo = `${loanInfo.loanSn}${comm.randNumberCode(6)}`;
    let data = {
      merid: payMerid,
      merchantOutOrderNo: merchantOutOrderNo,
      notifyUrl: notifyUrl,
      noncestr: comm.randCode(32),
      orderMoney: loanInfo.serviceMoney / 100,
      orderTime: date.formatDate(new Date(), 'YYYYMMDDHHmmss'),
      id: `${loanInfo.id}`,
      returnUrl: returnUrl,
      subMerchantName: subMerchantName
    };
    data.sign = encrypt
      .getMd5(
        `merchantOutOrderNo=${data.merchantOutOrderNo}&merid=${data.merid}&noncestr=${data.noncestr}&notifyUrl=${
          data.notifyUrl
        }&orderMoney=${data.orderMoney}&orderTime=${data.orderTime}&key=${payKey}`
      )
      .toLowerCase();

    let payType = 1;
    ctx.orm().ProofLoanPay.create({
      userid: ctx.work.userId,
      loanId: loanInfo.id,
      outOrderSn: data.merchantOutOrderNo,
      loanSn: loanInfo.loanSn,
      merId: data.merid,
      notifyUrl: data.notifyUrl,
      nonceStr: data.noncestr,
      orderMoney: `${data.orderMoney}`,
      orderTime: data.orderTime,
      sign: data.sign,
      payType: payType,
      payTypeName: payTypeNameDist[`${payType}`],
      payTime: 0,
      reqparam: JSON.stringify(data),
      repparam: '',
      payName: '汇潮YZ聚合支付-快捷支付',
      addTime: now,
      updateTime: now
    });*/

    let outOrderSn = `${loanInfo.loanSn}${comm.randNumberCode(6)}`;
    let data = {
      parter: payParter,
      type: `${payMentType}`,
      value: loanInfo.serviceMoney / 100,
      orderid: outOrderSn,
      callbackurl: notifyUrl,
      payerIp: '',
      attach: `${loanInfo.id}`,
      hrefbackurl: returnUrl
    };
    data.sign = encrypt.getMd5(
      `parter=${payParter}&type=${data.type}&value=${data.value}&orderid=${data.orderid}&callbackurl=${
        data.callbackurl
      }${payKey}`
    );

    let payType = 1;

    // 更新支付方式
    ctx.orm().ProofLoan.update(
      {
        payMentType: `${payMentType}`,
        payMentTypeName: payMentTypeNameDist[`${payMentType}`],
        updateTime: now
      },
      {
        where: {
          id: loanInfo.id,
          state: 1,
          isPay: 0
        }
      }
    );

    // 生成支付记录
    ctx.orm().ProofLoanPay.create({
      userid: ctx.work.userId,
      loanId: loanInfo.id,
      outOrderSn: data.orderid,
      loanSn: loanInfo.loanSn,
      merId: '',
      notifyUrl: data.callbackurl,
      nonceStr: '',
      orderMoney: `${data.value}`,
      orderTime: '',
      sign: data.sign,
      payType: payType,
      payTypeName: payTypeNameDist[`${payType}`],
      payTime: 0,
      reqparam: JSON.stringify(data),
      repparam: '',
      payName: '安信支付',
      addTime: now,
      updateTime: now
    });

    let payParam = Object.keys(data).map(key => {
      return {
        itemKey: key,
        itemVal: data[key]
      };
    });

    let payFormHtml = `<form id="pay_form" method="POST" action="http://payment.axwpay.com/bank/index.aspx">`;
    for (let i = 0, j = payParam.length; i < j; i++) {
      payFormHtml += `<input type="hidden" id="${payParam[i].itemKey}" name="${payParam[i].itemKey}" value="${
        payParam[i].itemVal
      }" />`;
    }
    payFormHtml += `</form>`;

    ctx.body = {
      payFormHtml: payFormHtml
    };
  },
  setLoanPay: async ctx => {
    console.log('ctx.request.body:', ctx.request.body);

    /* 
    let merchantOutOrderNo = ctx.request.body.merchantOutOrderNo || '';
    let merid = ctx.request.body.merid || '';
    let msg = ctx.request.body.msg || '';
    let noncestr = ctx.request.body.noncestr || '';
    let orderNo = ctx.request.body.orderNo || '';
    let payResult = ctx.request.body.payResult || 0;
    let aliNo = ctx.request.body.aliNo || '';
    let sign = ctx.request.body.sign || '';
    let loanId = ctx.request.body.id || 0;

    loanId = parseInt(loanId);
    payResult = parseInt(payResult);
    assert.notStrictEqual(merchantOutOrderNo, '', '入参不正确！');
    assert.notStrictEqual(merid, '', '入参不正确！');
    assert.notStrictEqual(msg, '', '入参不正确！');
    assert.notStrictEqual(noncestr, '', '入参不正确！');
    assert.notStrictEqual(orderNo, '', '入参不正确！');
    assert.notStrictEqual(payResult, 0, '入参不正确！');
    assert.notStrictEqual(sign, '', '入参不正确！');
    assert.notStrictEqual(loanId, 0, '入参不正确！');

    let encrypt_sign = encrypt
      .getMd5(
        `merchantOutOrderNo=${merchantOutOrderNo}&merid=${payMerid}&msg=${msg}&noncestr=${noncestr}&orderNo=${orderNo}&payResult=${payResult}&key=${payKey}`
      )
      .toLowerCase();

    assert.ok(encrypt_sign === sign, '签名错误！');

    let now = date.getTimeStamp();
    let state = 2;
    let payMsg = JSON.parse(msg);
    let payMoney = payMsg && payMsg.payMoney ? parseInt(parseFloat(payMsg.payMoney) * 100) : 0;
    let payType = payResult === 1 ? 2 : 1;
    */
    let orderid = ctx.request.body.orderid || '';
    let opstate = ctx.request.body.opstate;
    let ovalue = ctx.request.body.ovalue || 0;
    let sign = ctx.request.body.sign || '';
    let sysorderid = ctx.request.body.sysorderid || '';
    let completiontime = ctx.request.body.completiontime || '';
    let loanId = ctx.request.body.attach || 0;
    let msg = ctx.request.body.msg || '';

    loanId = parseInt(loanId);
    assert.notStrictEqual(orderid, '', '入参不正确！');
    assert.notStrictEqual(ovalue, 0, '入参不正确！');
    assert.notStrictEqual(sign, '', '入参不正确！');
    assert.notStrictEqual(sysorderid, '', '入参不正确！');
    assert.notStrictEqual(loanId, 0, '入参不正确！');

    let encrypt_sign = encrypt.getMd5(`orderid=${orderid}&opstate=${opstate}&ovalue=${ovalue}${payKey}`);

    assert.ok(encrypt_sign === sign, '签名错误！');

    let now = date.getTimeStamp();
    let state = 2;
    let payMoney = ovalue ? parseInt(parseFloat(ovalue) * 100) : 0;
    let payType = parseInt(opstate) === 0 ? 2 : 999;
    ctx.orm().ProofLoanPay.update(
      {
        payType,
        payTypeName: payTypeNameDist[`${payType}`],
        payTime: now,
        repparam: JSON.stringify(ctx.request.body),
        updateTime: now
      },
      {
        where: {
          outOrderSn: orderid,
          payType: 1,
          payTime: 0
        }
      }
    );

    ctx.orm().ProofLoan.update(
      {
        state: state,
        stateName: loanStateNameDist[`${state}`],
        isPay: 1,
        payTime: now,
        updateTime: now
      },
      {
        where: {
          id: loanId,
          state: 1,
          isPay: 0,
          serviceMoney: payMoney
        }
      }
    );

    ctx.body = 'opstate=0';
  }
};
