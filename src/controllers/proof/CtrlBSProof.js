/*
 * @Author: Lienren
 * @Date: 2018-11-22 14:07:43
 * @Last Modified by: Lienren
 * @Last Modified time: 2018-11-29 11:24:52
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

const payKey = 'gNociwieX1aCSkhvVemcXkaF9KVmkXm8';
const payMerid = 'yft2017082500005';
// const subMerchantName = '诚友信凭证管理平台'
const subMerchantName = '';
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

module.exports = {
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

    assert.notStrictEqual(loanMoney, 0, '入参不正确！');

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

    let merchantOutOrderNo = `${loanInfo.loanSn}${comm.randNumberCode(6)}`;
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
    });

    let payParam = Object.keys(data).map(key => {
      return {
        itemKey: key,
        itemVal: data[key]
      };
    });

    let payFormHtml = `<form id="pay_form" method="POST" action="https://alipay.3c-buy.com/api/createQuickOrder">`;
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
          outOrderSn: merchantOutOrderNo,
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

    ctx.body = 'success';
  }
};
