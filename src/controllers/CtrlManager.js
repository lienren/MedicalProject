/*
 * @Author: Lienren 
 * @Date: 2018-06-21 19:35:28 
 * @Last Modified by: Lienren
 * @Last Modified time: 2018-06-22 00:34:47
 */
'use strict';

const Op = require('sequelize').Op;
const assert = require('assert');
const comm = require('../utils/comm');
const date = require('../utils/date');
const encrypt = require('../utils/encrypt');

const configData = require('./ConfigData');
const now = date.getTimeStamp();

module.exports = {
  // 管理员登录
  login: async ctx => {
    let loginName = ctx.request.body.loginName || '';
    let loginPwd = ctx.request.body.loginPwd || '';
    let imgCode = ctx.request.body.imgCode || '';
    let imgCodeToken = ctx.request.body.imgCodeToken || '';

    assert.notStrictEqual(loginName, '', configData.ERROR_KEY_ENUM.InputParamIsNull);
    assert.notStrictEqual(loginPwd, '', configData.ERROR_KEY_ENUM.InputParamIsNull);
    assert.notStrictEqual(imgCode, '', configData.ERROR_KEY_ENUM.InputParamIsNull);
    assert.notStrictEqual(imgCodeToken, '', configData.ERROR_KEY_ENUM.InputParamIsNull);

    // 验证图形验证码
    let resultImgCodeToken = await ctx.orm().BaseImgCode.findOne({
      where: {
        token: imgCodeToken,
        imgCode: imgCode,
        isUse: 0,
        overTime: { [Op.gt]: now }
      }
    });
    assert.notStrictEqual(resultImgCodeToken, null, configData.ERROR_KEY_ENUM.ImageCodeIsFail);

    // 设置图形验证码已使用
    ctx.orm().BaseImgCode.update(
      { isUse: 1 },
      {
        where: {
          token: imgCodeToken,
          imgCode: imgCode
        }
      }
    );

    let resultManager = await ctx.orm().SuperManagerInfo.findOne({
      where: {
        loginname: loginName,
        state: 1
      }
    });
    assert.notStrictEqual(resultManager, null, configData.ERROR_KEY_ENUM.ManagerNotExists);

    // 生成验证密钥
    let encryptPwd = encrypt.getMd5(`${loginPwd}|${resultManager.salt}`);
    assert.ok(resultManager.loginPwd === encryptPwd, configData.ERROR_KEY_ENUM.ManagerPasswordIsFail);

    // 设置Token
    let ManagerTokenOverTime = await configData.getConfig(ctx, configData.CONFIG_KEY_ENUM.ManagerTokenOverTime);
    let token = comm.getGuid();
    let tokenOverTime = now + ManagerTokenOverTime * 60 * 1000;
    ctx.orm().SuperManagerInfo.update(
      {
        token: token,
        tokenOverTime: tokenOverTime,
        lastTime: now
      },
      {
        where: { id: resultManager.id }
      }
    );

    ctx.body = {
      id: resultManager.id,
      loginName: resultManager.loginName,
      realName: resultManager.realName,
      phone: resultManager.phone,
      token: token
    };
  },
  // 管理员修改密码
  setPassword: async ctx => {
    let oldPassword = ctx.request.body.oldPassword || '';
    let newPassword = ctx.request.body.newPassword || '';

    assert.notStrictEqual(oldPassword, '', configData.ERROR_KEY_ENUM.InputParamIsNull);
    assert.notStrictEqual(newPassword, '', configData.ERROR_KEY_ENUM.InputParamIsNull);

    let resultManager = await ctx.orm().SuperManagerInfo.findOne({
      where: {
        id: ctx.work.managerId,
        state: 1
      }
    });
    assert.notStrictEqual(resultManager, null, configData.ERROR_KEY_ENUM.ManagerNotExists);

    // 生成验证密钥
    let encryptOldPwd = encrypt.getMd5(`${oldPassword}|${resultManager.salt}`);
    assert.ok(resultManager.loginPwd === encryptOldPwd, configData.ERROR_KEY_ENUM.ManagerOldPasswordIsFail);

    // 重新生成密钥索引
    let ManagerPwdSaleCount = await configData.getConfig(ctx, configData.CONFIG_KEY_ENUM.ManagerPwdSaleCount);
    let salt = comm.randCode(ManagerPwdSaleCount);

    ctx.orm().SuperManagerInfo.update(
      {
        loginPwd: encrypt.getMd5(`${newPassword}|${salt}`),
        salt: salt,
        lastTime: now,
        token: '',
        tokenOverTime: now
      },
      {
        where: { id: ctx.work.managerId }
      }
    );

    ctx.body = {};
  }
};
