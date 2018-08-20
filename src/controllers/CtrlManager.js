/*
 * @Author: Lienren 
 * @Date: 2018-06-21 19:35:28 
 * @Last Modified by: Lienren
 * @Last Modified time: 2018-08-20 15:59:26
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
        state: 1,
        isDel: 0
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
  setPassword: async ctx => {
    let oldPassword = ctx.request.body.oldPassword || '';
    let newPassword = ctx.request.body.newPassword || '';

    assert.notStrictEqual(oldPassword, '', configData.ERROR_KEY_ENUM.InputParamIsNull);
    assert.notStrictEqual(newPassword, '', configData.ERROR_KEY_ENUM.InputParamIsNull);

    let resultManager = await ctx.orm().SuperManagerInfo.findOne({
      where: {
        id: ctx.work.managerId,
        state: 1,
        isDel: 0
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
  },
  getManagers: async ctx => {
    let current = ctx.request.body.current || 1;
    let pageSize = ctx.request.body.pageSize || 20;
    let loginName = ctx.request.body.loginName || '';
    let realName = ctx.request.body.realName || '';
    let phone = ctx.request.body.phone || '';
    let state = ctx.request.body.state;
    let condition = {};

    if (loginName !== '') {
      condition.loginName = {
        [Op.like]: `%${loginName}%`
      };
    }
    if (realName !== '') {
      condition.realName = {
        [Op.like]: `%${realName}%`
      };
    }
    if (phone !== '') {
      condition.phone = {
        [Op.like]: `%${phone}%`
      };
    }
    if (state !== -1) {
      condition.state = state;
    }

    condition.isDel = 0;

    let resultCount = await ctx.orm().SuperManagerInfo.findAndCount({
      where: condition
    });
    let result = await ctx.orm().SuperManagerInfo.findAll({
      attributes: ['id', 'loginName', 'realName', 'phone', 'state', 'addTime', 'lastTime'],
      offset: (current - 1) * pageSize,
      limit: pageSize,
      where: condition,
      order: [['addTime', 'DESC']]
    });

    ctx.body = {
      totle: resultCount.count,
      list: result,
      current,
      pageSize
    };
  },
  addManager: async ctx => {
    let id = ctx.request.body.id || 0;
    let loginName = ctx.request.body.loginName || '';
    let loginPwd = ctx.request.body.loginPwd || '';
    let realName = ctx.request.body.realName || '';
    let phone = ctx.request.body.phone || '';
    let state = ctx.request.body.state;

    let sameManagerResult = ctx.orm().SuperManagerInfo.findOne({
      where: {
        loginName: loginName,
        isDel: 0
      }
    });

    assert.ok(sameManagerResult !== null, 'ManagerLoginNameExists');

    // 重新生成密钥索引
    let ManagerPwdSaleCount = await configData.getConfig(ctx, configData.CONFIG_KEY_ENUM.ManagerPwdSaleCount);
    let salt = comm.randCode(ManagerPwdSaleCount);

    ctx.orm().SuperManagerInfo.create({
      loginName: loginName,
      loginPwd: encrypt.getMd5(`${loginPwd}|${salt}`),
      realName: realName,
      phone: phone,
      salt: salt,
      state: state,
      token: '',
      tokenOverTime: now,
      addTime: now,
      lastTime: now,
      isDel: 0
    });
  },
  editManager: async ctx => {
    let id = ctx.request.body.id || 0;
    let loginName = ctx.request.body.loginName || '';
    let loginPwd = ctx.request.body.loginPwd || '';
    let realName = ctx.request.body.realName || '';
    let phone = ctx.request.body.phone || '';
    let state = ctx.request.body.state;

    let updateField = {};

    let sameManagerResult = ctx.orm().SuperManagerInfo.findOne({
      where: {
        id: id,
        isDel: 0
      }
    });

    assert.notStrictEqual(sameManagerResult, null, 'ManagerNotExists');

    if (loginPwd !== '') {
      // 重新生成密钥索引
      let ManagerPwdSaleCount = await configData.getConfig(ctx, configData.CONFIG_KEY_ENUM.ManagerPwdSaleCount);
      let salt = comm.randCode(ManagerPwdSaleCount);
      loginPwd = encrypt.getMd5(`${loginPwd}|${salt}`);

      updateField.salt = salt;
      updateField.loginPwd = loginPwd;
    }

    if (sameManagerResult.id === 1) {
      // 超级管理员只能修改密码和手机号
      updateField.phone = phone;
    } else {
      updateField.realName = realName;
      updateField.phone = phone;
      updateField.state = state;
      if (state === 0) {
        // 关闭状态时，清除token
        updateField.token = '';
      }
    }
    updateField.lastTime = now;

    ctx.orm().SuperManagerInfo.update(updateField, {
      where: {
        id: id
      }
    });

    ctx.body = {};
  },
  editManagerState: async ctx => {
    let id = ctx.request.body.id || 0;
    let state = ctx.request.body.state;

    // 超级管理员禁止更新
    assert.notStrictEqual(id, 1, 'SuperManagerNotUpdate');

    let sameManagerResult = ctx.orm().SuperManagerInfo.findOne({
      where: {
        id: id,
        isDel: 0
      }
    });

    assert.notStrictEqual(sameManagerResult, null, 'ManagerNotExists');

    if (state === 0) {
      // 关闭状态时，清除token
      ctx.orm().SuperManagerInfo.update(
        {
          state: state,
          toke: ''
        },
        {
          where: {
            id: id
          }
        }
      );
    } else {
      ctx.orm().SuperManagerInfo.update(
        {
          state: state
        },
        {
          where: {
            id: id
          }
        }
      );
    }

    ctx.body = {};
  },
  delManager: async ctx => {
    let id = ctx.request.body.id || 0;

    // 超级管理员禁止更新
    assert.notStrictEqual(id, 1, 'SuperManagerNotUpdate');

    let sameManagerResult = ctx.orm().SuperManagerInfo.findOne({
      where: {
        id: id,
        isDel: 0
      }
    });

    assert.notStrictEqual(sameManagerResult, null, 'ManagerNotExists');

    // 删除时，清除token
    ctx.orm().SuperManagerInfo.update(
      {
        token: '',
        isDel: 1
      },
      {
        where: {
          id: id
        }
      }
    );

    ctx.body = {};
  }
};
